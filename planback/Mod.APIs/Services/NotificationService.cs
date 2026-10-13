using Microsoft.AspNetCore.SignalR;
using Mod.APIs.Helpers;
using Mod.Core.Entities;
using Mod.Core.Enums;
using Mod.Core.Services.Contract.NotificationService;
using Mod.Core.Utils;

namespace Mod.APIs.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ModContext _context;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            IHubContext<NotificationHub> hubContext,
            ModContext context,
            ILogger<NotificationService> logger)
        {
            _hubContext = hubContext;
            _context = context;
            _logger = logger;
        }

        public async Task NotifyAsync(
            NotificationAction action,
            ModulesNamesOnArabic module,
            Units unit,
            FormNameToReturnToFront formName,
            int formId,
            RoleEnum actingRole,
            string? planName = null)
        {
            try
            {
                // BroadcastPlan is the only action that doesn't require a unit context.
                if (unit is null && action != NotificationAction.BroadcastPlan)
                {
                    _logger.LogWarning(
                        "NotifyAsync skipped: unit is null for action {Action}, module {Module}, formId {FormId}, actingRole {ActingRole}",
                        action, module, formId, actingRole);
                    return;
                }

                var message = NotificationMessages.Build(action, module, unit?.Name, actingRole, planName);

                var (targets, groups) = ResolveRecipients(action, actingRole, unit);

                if (targets.Count == 0)
                {
                    _logger.LogWarning(
                        "NotifyAsync produced no targets: action {Action}, actingRole {ActingRole}, formId {FormId}",
                        action, actingRole, formId);
                    return;
                }

                // Save a notification per target first
                var savedNotifications = new List<(Notification notification, string group)>();
                for (int i = 0; i < targets.Count; i++)
                {
                    var notification = new Notification
                    {
                        Message = message,
                        IsRead = false,
                        FormId = formId,
                        FormNameToReturnToFront = formName,
                        NotificationRolesTargets = new List<NotificationRolesTarget> { targets[i] }
                    };
                    _context.Notification.Add(notification);
                    savedNotifications.Add((notification, groups[i]));
                }
                await _context.SaveChangesAsync();

                // Send real-time after all notifications are saved
                var realTimeTasks = savedNotifications.Select(entry =>
                {
                    var notificationDto = new
                    {
                        id = entry.notification.Id,
                        message = entry.notification.Message,
                        isRead = false,
                        formNameToReturnToFront = entry.notification.FormNameToReturnToFront.GetDisplayName(),
                        planId = entry.notification.FormId
                    };
                    return _hubContext.Clients.Group(entry.group).SendAsync("ReceiveNotification", message, notificationDto);
                });

                await Task.WhenAll(realTimeTasks);
            }
            catch (Exception ex)
            {
                // Notification delivery must never break the calling controller.
                _logger.LogError(ex,
                    "NotifyAsync failed: action {Action}, module {Module}, formId {FormId}, actingRole {ActingRole}",
                    action, module, formId, actingRole);
            }
        }

        // Explicit addressing, used by feedback requests and their answers.
        //
        // A unit addressee reaches everyone in that unit, employees and the unit
        // manager alike, because they sit in different SignalR groups. A user
        // addressee reaches exactly that person.
        public async Task NotifyRecipientsAsync(
            string message,
            FormNameToReturnToFront formName,
            int formId,
            IEnumerable<int> unitIds,
            IEnumerable<int> userIds)
        {
            try
            {
                var units = unitIds?.Distinct().ToList() ?? new List<int>();
                var users = userIds?.Distinct().ToList() ?? new List<int>();

                if (units.Count == 0 && users.Count == 0)
                {
                    _logger.LogWarning(
                        "NotifyRecipientsAsync had no addressees: formName {FormName}, formId {FormId}",
                        formName, formId);
                    return;
                }

                var saved = new List<(Notification notification, List<string> groups)>();

                foreach (var unitId in units)
                {
                    // Two rows per unit, because the notification query matches on
                    // Role as well as UnitId, and a unit manager does not read the
                    // employees' rows.
                    foreach (var role in new[] { nameof(RoleEnum.UnitEmployee), nameof(RoleEnum.UnitManager) })
                    {
                        var notification = new Notification
                        {
                            Message = message,
                            IsRead = false,
                            FormId = formId,
                            FormNameToReturnToFront = formName,
                            NotificationRolesTargets = new List<NotificationRolesTarget>
                            {
                                new() { Role = role, UnitId = unitId }
                            }
                        };
                        _context.Notification.Add(notification);
                        saved.Add((notification, new List<string>
                        {
                            role == nameof(RoleEnum.UnitManager) ? $"Role_UnitManager_{unitId}" : $"Unit_{unitId}"
                        }));
                    }
                }

                foreach (var userId in users)
                {
                    var appUser = await _context.AppUsers.FirstOrDefaultAsync(u => u.Id == userId);
                    var notification = new Notification
                    {
                        Message = message,
                        IsRead = false,
                        FormId = formId,
                        FormNameToReturnToFront = formName,
                        NotificationRolesTargets = new List<NotificationRolesTarget>
                        {
                            new() { Role = string.Empty, UserId = userId, UnitId = appUser?.UnitId }
                        }
                    };
                    _context.Notification.Add(notification);
                    saved.Add((notification, new List<string> { $"User_{userId}" }));
                }

                await _context.SaveChangesAsync();

                var pushes = saved.SelectMany(entry => entry.groups.Select(group =>
                {
                    var dto = new
                    {
                        id = entry.notification.Id,
                        message = entry.notification.Message,
                        isRead = false,
                        formNameToReturnToFront = entry.notification.FormNameToReturnToFront.GetDisplayName(),
                        planId = entry.notification.FormId
                    };
                    return _hubContext.Clients.Group(group).SendAsync("ReceiveNotification", message, dto);
                }));

                await Task.WhenAll(pushes);
            }
            catch (Exception ex)
            {
                // Same rule as NotifyAsync: delivery must never break the caller.
                _logger.LogError(ex,
                    "NotifyRecipientsAsync failed: formName {FormName}, formId {FormId}",
                    formName, formId);
            }
        }

        private (List<NotificationRolesTarget> targets, List<string> groups) ResolveRecipients(
            NotificationAction action, RoleEnum actingRole, Units? unit)
        {
            var targets = new List<NotificationRolesTarget>();
            var groups = new List<string>();

            switch (action)
            {
                case NotificationAction.Submit:
                    // Employee → UnitManager of the unit
                    targets.Add(new NotificationRolesTarget { Role = nameof(RoleEnum.UnitManager), UnitId = unit!.Id, Unit = unit });
                    groups.Add($"Role_UnitManager_{unit.Id}");
                    break;

                case NotificationAction.Approve:
                    if (actingRole == RoleEnum.UnitManager)
                    {
                        // UnitManager → RegionManager + UnitEmployee(unit)
                        targets.Add(new NotificationRolesTarget { Role = nameof(RoleEnum.RegionManager) });
                        targets.Add(new NotificationRolesTarget { Role = nameof(RoleEnum.UnitEmployee), UnitId = unit!.Id, Unit = unit });
                        groups.Add($"Role_{RoleEnum.RegionManager}");
                        groups.Add($"Unit_{unit.Id}");
                    }
                    else if (actingRole == RoleEnum.RegionManager)
                    {
                        // RegionManager → HighManagement + UnitEmployee(unit) + UnitManager(unit)
                        targets.Add(new NotificationRolesTarget { Role = nameof(RoleEnum.HighManagement) });
                        targets.Add(new NotificationRolesTarget { Role = nameof(RoleEnum.UnitEmployee), UnitId = unit!.Id, Unit = unit });
                        targets.Add(new NotificationRolesTarget { Role = nameof(RoleEnum.UnitManager), UnitId = unit.Id, Unit = unit });
                        groups.Add($"Role_{RoleEnum.HighManagement}");
                        groups.Add($"Unit_{unit.Id}");
                        groups.Add($"Role_UnitManager_{unit.Id}");
                    }
                    else if (actingRole == RoleEnum.HighManagement)
                    {
                        // Defensive: callers normally use FinalApprove for HighManagement.
                        // Fall through to FinalApprove targeting so we never silently no-op.
                        AddFinalApproveTargets(targets, groups, unit!);
                    }
                    break;

                case NotificationAction.FinalApprove:
                    AddFinalApproveTargets(targets, groups, unit!);
                    break;

                // «إشعارات بمدى التقدم في مراحل الاستراتيجية» — everyone working
                // the plan hears that it has moved on to the next stage, which is
                // separate information from the approval that caused the move.
                case NotificationAction.StageProgress:
                    AddFinalApproveTargets(targets, groups, unit!);
                    targets.Add(new NotificationRolesTarget { Role = nameof(RoleEnum.HighManagement) });
                    groups.Add($"Role_{RoleEnum.HighManagement}");
                    break;

                case NotificationAction.Reject:
                case NotificationAction.Return:
                    // Always notify the unit's employees (where the work originated).
                    targets.Add(new NotificationRolesTarget { Role = nameof(RoleEnum.UnitEmployee), UnitId = unit!.Id, Unit = unit });
                    groups.Add($"Unit_{unit.Id}");

                    // Acting from above the unit also notifies the UnitManager of that unit.
                    // UnitManagers join Role_UnitManager_{unitId}, NOT Unit_{unitId}.
                    if (actingRole == RoleEnum.RegionManager || actingRole == RoleEnum.HighManagement)
                    {
                        targets.Add(new NotificationRolesTarget { Role = nameof(RoleEnum.UnitManager), UnitId = unit.Id, Unit = unit });
                        groups.Add($"Role_UnitManager_{unit.Id}");
                    }

                    // HighManagement also notifies RegionManagers (they sit between).
                    if (actingRole == RoleEnum.HighManagement)
                    {
                        targets.Add(new NotificationRolesTarget { Role = nameof(RoleEnum.RegionManager) });
                        groups.Add($"Role_{RoleEnum.RegionManager}");
                    }
                    break;

                case NotificationAction.BroadcastPlan:
                    // Everyone except HighManagement (who is the broadcaster).
                    var targetRoles = Enum.GetValues(typeof(RoleEnum))
                        .Cast<RoleEnum>()
                        .Where(r => r != RoleEnum.HighManagement)
                        .ToList();

                    foreach (var role in targetRoles)
                    {
                        targets.Add(new NotificationRolesTarget { Role = role.ToString() });
                        groups.Add($"Role_{role}");
                    }
                    break;
            }

            return (targets, groups);
        }

        private static void AddFinalApproveTargets(
            List<NotificationRolesTarget> targets,
            List<string> groups,
            Units unit)
        {
            // HighManagement final-approved → notify RegionManager + UnitEmployee(unit) + UnitManager(unit).
            targets.Add(new NotificationRolesTarget { Role = nameof(RoleEnum.RegionManager) });
            targets.Add(new NotificationRolesTarget { Role = nameof(RoleEnum.UnitEmployee), UnitId = unit.Id, Unit = unit });
            targets.Add(new NotificationRolesTarget { Role = nameof(RoleEnum.UnitManager), UnitId = unit.Id, Unit = unit });
            groups.Add($"Role_{RoleEnum.RegionManager}");
            groups.Add($"Unit_{unit.Id}");
            groups.Add($"Role_UnitManager_{unit.Id}");
        }
    }
}
