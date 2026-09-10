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
