using Mod.Core.Utils;

namespace Mod.APIs.Controllers
{
    [Route("/api/Plans/{PlanId}/Analysis")]

    public class PlanAnalysisController : BaseController
    {
        private readonly IPlanAnalysisService _planAnalysisService;
        private readonly ICurrentUserService _currentUser;
        private readonly INotificationService _notification;
        private readonly ModContext context;

        public PlanAnalysisController(IPlanAnalysisService planAnalysisService, ICurrentUserService currentUser,INotificationService notificationService,ModContext context)
        {
            _planAnalysisService = planAnalysisService;
            _currentUser = currentUser;
            _notification = notificationService;
            this.context = context;
        }

		[HttpGet]
        [Authorize(Policy = "Analysis.GetOne")]

        public async Task<IActionResult> GetPlanById(int PlanId)
        {
            var result = await _planAnalysisService.GetById(PlanId);
            return Ok(result);
        }


        // Get All Plan Analysis With Pagination and Filter by date and area for admin role only
        [HttpGet("GetAll")]
        [Authorize(Policy = "Analysis.GetAll")]
        public async Task<IActionResult> GetAll([FromQuery] int UnitId = 0, [FromQuery] string? Year = null, [FromQuery] int PerPage = 5, [FromQuery] int Page = 0)
        {
            var response =  await _planAnalysisService.GetAllForHighMangment(UnitId, Year, Page, PerPage);
            if (response.Data.Count() < 1)
                return Ok(response);

            if (response.Data.First().Id == -1)
                return Forbid();
            return Ok(response);
        }


        [HttpPost("Approve")]
        [Authorize(Policy = "Analysis.Approve")]
        public async Task<IActionResult> Approve(int PlanId)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var actingRole = Enum.Parse<RoleEnum>(user.Role);
            var points = await context.AnalysisPoints.Where(p => p.PlanId == PlanId).ToListAsync();
            if (points.Any(p => Utils.IsRejectedOrReturned(p.Status)))
            {
                return BadRequest(new { message = "لا يمكن اعتماد المرحلة لوجود عناصر مرفوضة أو مُرجعة أو لم يتم اتخاذ إجراء عليها بعد" });
            }

            var result = await _planAnalysisService.Approve(PlanId, user);
            var notifAction = actingRole == RoleEnum.HighManagement ? NotificationAction.FinalApprove : NotificationAction.Approve;

            // Notify the PLAN's unit (employee + unit manager), not the approver's
            // unit — otherwise region/high management approvals never reach the
            // plan's employees.
            var plan = await context.Plans.Include(p => p.Units).FirstOrDefaultAsync(p => p.Id == PlanId);
            var unit = plan?.Units ?? await context.Units.FirstOrDefaultAsync(i => i.Id == user.UnitId);

            await _notification.NotifyAsync(notifAction, ModulesNamesOnArabic.Analsis, unit, FormNameToReturnToFront.analysisstage, PlanId, actingRole);

            // «إشعارات بمدى التقدم» — the plan has entered the strategic direction
            // stage, which the service advanced it to a moment ago.
            if (actingRole == RoleEnum.HighManagement)
            {
                await _notification.NotifyAsync(NotificationAction.StageProgress, ModulesNamesOnArabic.Direction, unit, FormNameToReturnToFront.directionstage, PlanId, actingRole, plan?.Name);
            }

            return Ok(result);
        }
    }
}
