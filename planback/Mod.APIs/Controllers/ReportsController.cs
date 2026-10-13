using Mod.Core.Services.Contract;
using Mod.Core.Utils;

namespace Mod.APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        // Whitelist of attachment extensions accepted with a percentage submission.
        private static readonly string[] AttachmentExtensions =
            { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png" };

        #region Failds
        private readonly IReportService _reportService;
        private readonly ModContext context;
        private readonly ICurrentUserService _currentUser;
        private readonly INotificationService _notification;
        #endregion

        #region Constructors
        public ReportsController(
            IReportService reportService,
            ModContext context,
            ICurrentUserService currentUser,
            INotificationService notification)
        {
            _reportService = reportService;
            this.context = context;
            _currentUser = currentUser;
            _notification = notification;
        }
        #endregion

        #region APIs

        // Manager view (reads latest approved value via the service).
        [Authorize(Policy = "Reports.GetAll")]
        [HttpGet("unit")]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _reportService.GetAll());
        }

        // Employee submits a new percentage. Replaces any existing pending row
        // (single live cycle); kicks off Pending → UnitManager review.
        [Authorize(Policy = "Reports.Update")]
        [HttpPost("Submit/{ProjectId}")]
        public async Task<IActionResult> SubmitPercentage(int ProjectId, [FromForm] double percentage, [FromForm] IFormFile? file)
        {
            var project = await context.PlanProjects
                .Where(i => i.Id == ProjectId)
                .Include(i => i.Percentage)
                .Include(i => i.Units)
                .FirstOrDefaultAsync();

            if (project == null)
                return NotFound($"Project with ID {ProjectId} not found.");

            var user = await _currentUser.GetCurrentUserAsync();

            string? filePath = null;
            if (file != null && file.Length > 0)
            {
                var uploadResult = Upload.UploadFile(file, AttachmentExtensions, "Reports");
                if (uploadResult.StartsWith("File is empty.") || uploadResult.StartsWith("Invalid file type.") || uploadResult.StartsWith("Error:"))
                {
                    return BadRequest(new { message = uploadResult });
                }
                filePath = uploadResult;
            }

            // Single live cycle: reuse the existing pending row if present, otherwise create a new one.
            var pending = await context.ProjectPercentageHistory
                .Where(h => h.ProjectId == ProjectId
                            && (h.Status == ApprovalStatus.Pending
                                || h.Status == ApprovalStatus.ReturnedByUnitManager
                                || h.Status == ApprovalStatus.ReturnedByRegionManager
                                || h.Status == ApprovalStatus.ReturnedByHighManagement
                                || h.Status == ApprovalStatus.RejectedByUnitManager
                                || h.Status == ApprovalStatus.RejectedByRegionManager
                                || h.Status == ApprovalStatus.RejectedByHighManagement))
                .OrderByDescending(h => h.Id)
                .FirstOrDefaultAsync();

            if (pending == null)
            {
                pending = new ProjectPercentageHistory
                {
                    ProjectId = ProjectId,
                    Project = project,
                    Value = percentage.ToString(),
                    Status = ApprovalStatus.Pending,
                    Comment = null,
                    FilePath = filePath,
                    AppUserId = user?.Id,
                    User = user,
                    CreatedAt = DateTime.UtcNow
                };
                context.ProjectPercentageHistory.Add(pending);
            }
            else
            {
                pending.Value = percentage.ToString();
                pending.Status = ApprovalStatus.Pending;
                pending.Comment = null;
                if (filePath != null) pending.FilePath = filePath; // keep previous file if no new upload
                pending.AppUserId = user?.Id;
                pending.UpdatedAt = DateTime.UtcNow;
                context.ProjectPercentageHistory.Update(pending);
            }

            // Mirror live status onto project.Percentage so existing read paths still see the cycle.
            if (project.Percentage == null)
            {
                project.Percentage = new ProjectItems
                {
                    Value = percentage.ToString(),
                    Status = ApprovalStatus.Pending
                };
            }
            else
            {
                project.Percentage.Value = percentage.ToString();
                project.Percentage.Status = ApprovalStatus.Pending;
                project.Percentage.Comment = null;
                context.ProjectItems.Update(project.Percentage);
            }
            context.PlanProjects.Update(project);

            await context.SaveChangesAsync();

            var unit = project.Units ?? await context.Units.FirstOrDefaultAsync(u => u.Id == project.UnitId);
            await _notification.NotifyAsync(
                NotificationAction.Submit,
                ModulesNamesOnArabic.Project,
                unit,
                FormNameToReturnToFront.reports,
                project.PlanId,
                RoleEnum.UnitEmployee);

            return Ok(new { message = "ok", historyId = pending.Id, filePath });
        }

        // Validates that the acting role can act at the current status (mirrors the
        // sequential cycle used by goals/initiatives/projects):
        //   Pending                  → UnitManager
        //   ApprovedByUnitManager    → RegionManager
        //   ApprovedByRegionManager  → HighManagement
        // Anything else (already approved/rejected at this level, or out of sequence)
        // is rejected so a manager can't skip ahead or double-act.
        private static bool RoleCanActOn(RoleEnum role, ApprovalStatus status)
        {
            return role switch
            {
                RoleEnum.UnitManager => status == ApprovalStatus.Pending,
                RoleEnum.RegionManager =>
                    status == ApprovalStatus.ApprovedByUnitManager ||
                    status == ApprovalStatus.ApprovedByUnitManagerPartially,
                RoleEnum.HighManagement =>
                    status == ApprovalStatus.ApprovedByRegionManager ||
                    status == ApprovalStatus.ApprovedByRegionManagerPartially,
                _ => false,
            };
        }

        // Looks up the latest history row for a project. If the project predates
        // the history table (mirror exists on project.Percentage but no rows yet),
        // backfills a history row from the mirror so the cycle can act on it.
        // Returns null only when there is genuinely nothing to act on.
        private async Task<ProjectPercentageHistory?> GetOrBackfillLiveAsync(PlanProjects project)
        {
            var live = await context.ProjectPercentageHistory
                .Where(h => h.ProjectId == project.Id)
                .OrderByDescending(h => h.Id)
                .FirstOrDefaultAsync();

            if (live != null) return live;

            if (project.Percentage == null || string.IsNullOrEmpty(project.Percentage.Value))
                return null;

            live = new ProjectPercentageHistory
            {
                ProjectId = project.Id,
                Project = project,
                Value = project.Percentage.Value,
                Status = project.Percentage.Status ?? ApprovalStatus.Pending,
                Comment = project.Percentage.Comment,
                FilePath = null,
                AppUserId = project.AppUserId,
                CreatedAt = DateTime.UtcNow
            };
            context.ProjectPercentageHistory.Add(live);
            await context.SaveChangesAsync();
            return live;
        }

        // Manager approves the current pending percentage cycle.
        [Authorize(Policy = "Reports.Approve")]
        [HttpPost("ApprovePercentage/{ProjectId}")]
        public async Task<IActionResult> ApprovePercentage(int ProjectId)
        {
            var project = await context.PlanProjects
                .Where(i => i.Id == ProjectId)
                .Include(i => i.Percentage)
                .Include(i => i.Units)
                .FirstOrDefaultAsync();

            if (project == null)
                return NotFound($"Project with ID {ProjectId} not found.");

            var user = await _currentUser.GetCurrentUserAsync();
            if (user?.Role == null) return Forbid();
            var actingRole = Enum.Parse<RoleEnum>(user.Role);

            var live = await GetOrBackfillLiveAsync(project);

            if (live == null)
                return BadRequest("No percentage submission found for this project.");

            if (!RoleCanActOn(actingRole, live.Status))
                return BadRequest(new { message = "لا يمكنك الموافقة على هذه النسبة في هذه المرحلة" });

            // V2 = full approve at this role's level (matches ApproveStage pattern).
            var newStatus = Utils.GetApprovalStatusV2(ActionEnum.Approve, actingRole);
            live.Status = newStatus;
            live.UpdatedAt = DateTime.UtcNow;
            context.ProjectPercentageHistory.Update(live);

            if (project.Percentage != null)
            {
                project.Percentage.Status = newStatus;
                project.Percentage.Value = live.Value; // ensure mirror reflects what is being approved
                context.ProjectItems.Update(project.Percentage);
            }

            await context.SaveChangesAsync();

            var unit = project.Units ?? await context.Units.FirstOrDefaultAsync(u => u.Id == project.UnitId);
            var notifAction = actingRole == RoleEnum.HighManagement
                ? NotificationAction.FinalApprove
                : NotificationAction.Approve;
            await _notification.NotifyAsync(
                notifAction,
                ModulesNamesOnArabic.Project,
                unit,
                FormNameToReturnToFront.reports,
                project.PlanId,
                actingRole);

            return Ok(new { message = "ok", status = live.Status.ToString() });
        }

        [Authorize(Policy = "Reports.Reject")]
        [HttpPost("RejectPercentage/{ProjectId}")]
        public async Task<IActionResult> RejectPercentage(int ProjectId, [FromBody] Comment comment)
        {
            var project = await context.PlanProjects
                .Where(i => i.Id == ProjectId)
                .Include(i => i.Percentage)
                .Include(i => i.Units)
                .FirstOrDefaultAsync();

            if (project == null)
                return NotFound($"Project with ID {ProjectId} not found.");

            var user = await _currentUser.GetCurrentUserAsync();
            if (user?.Role == null) return Forbid();
            var actingRole = Enum.Parse<RoleEnum>(user.Role);

            var live = await GetOrBackfillLiveAsync(project);

            if (live == null)
                return BadRequest("No percentage submission found for this project.");

            if (!RoleCanActOn(actingRole, live.Status))
                return BadRequest(new { message = "لا يمكنك رفض هذه النسبة في هذه المرحلة" });

            var newStatus = Utils.GetApprovalStatus(ActionEnum.Reject, actingRole);

            live.Status = newStatus;
            live.Comment = comment?.Comments;
            live.UpdatedAt = DateTime.UtcNow;
            context.ProjectPercentageHistory.Update(live);

            if (project.Percentage != null)
            {
                project.Percentage.Status = newStatus;
                project.Percentage.Comment = comment?.Comments;
                context.ProjectItems.Update(project.Percentage);
            }

            await context.SaveChangesAsync();

            var unit = project.Units ?? await context.Units.FirstOrDefaultAsync(u => u.Id == project.UnitId);
            await _notification.NotifyAsync(
                NotificationAction.Reject,
                ModulesNamesOnArabic.Project,
                unit,
                FormNameToReturnToFront.reports,
                project.PlanId,
                actingRole);

            return Ok(new { message = "ok" });
        }

        [Authorize(Policy = "Reports.Return")]
        [HttpPost("ReturnPercentage/{ProjectId}")]
        public async Task<IActionResult> ReturnPercentage(int ProjectId, [FromBody] Comment comment)
        {
            var project = await context.PlanProjects
                .Where(i => i.Id == ProjectId)
                .Include(i => i.Percentage)
                .Include(i => i.Units)
                .FirstOrDefaultAsync();

            if (project == null)
                return NotFound($"Project with ID {ProjectId} not found.");

            var user = await _currentUser.GetCurrentUserAsync();
            if (user?.Role == null) return Forbid();
            var actingRole = Enum.Parse<RoleEnum>(user.Role);

            var live = await GetOrBackfillLiveAsync(project);

            if (live == null)
                return BadRequest("No percentage submission found for this project.");

            if (!RoleCanActOn(actingRole, live.Status))
                return BadRequest(new { message = "لا يمكنك إعادة هذه النسبة في هذه المرحلة" });

            var newStatus = Utils.GetApprovalStatus(ActionEnum.Return, actingRole);

            live.Status = newStatus;
            live.Comment = comment?.Comments;
            live.UpdatedAt = DateTime.UtcNow;
            context.ProjectPercentageHistory.Update(live);

            if (project.Percentage != null)
            {
                project.Percentage.Status = newStatus;
                project.Percentage.Comment = comment?.Comments;
                context.ProjectItems.Update(project.Percentage);
            }

            await context.SaveChangesAsync();

            var unit = project.Units ?? await context.Units.FirstOrDefaultAsync(u => u.Id == project.UnitId);
            await _notification.NotifyAsync(
                NotificationAction.Return,
                ModulesNamesOnArabic.Project,
                unit,
                FormNameToReturnToFront.reports,
                project.PlanId,
                actingRole);

            return Ok(new { message = "ok" });
        }

        // Audit trail — full history of percentage submissions for a project.
        [Authorize(Policy = "Reports.GetAll")]
        [HttpGet("History/{ProjectId}")]
        public async Task<IActionResult> GetPercentageHistory(int ProjectId)
        {
            var rows = await context.ProjectPercentageHistory
                .Where(h => h.ProjectId == ProjectId)
                .Include(h => h.User)
                .OrderByDescending(h => h.Id)
                .Select(h => new
                {
                    id = h.Id,
                    value = h.Value,
                    status = h.Status.ToString(),
                    comment = h.Comment,
                    filePath = h.FilePath,
                    employeeName = h.User != null ? h.User.DisplayName : null,
                    createdAt = h.CreatedAt,
                    updatedAt = h.UpdatedAt
                })
                .ToListAsync();

            return Ok(rows);
        }

        // Backwards-compatible alias used by older FE code that hits POST /Reports/{id}/{percentage}.
        // Forwards to the new submit flow without an attachment.
        [Authorize(Policy = "Reports.Update")]
        [HttpPost("{ProjectId}/{percentage}")]
        public Task<IActionResult> UpdateProjectPercentage(int ProjectId, double percentage)
            => SubmitPercentage(ProjectId, percentage, null);

        #endregion
    }
}
