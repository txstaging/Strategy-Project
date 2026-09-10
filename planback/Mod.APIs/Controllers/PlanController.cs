namespace Mod.APIs.Controllers
{
    [Route("api/Plans")]
    [ApiController]
    public class PlanController : BaseController
    {
        private readonly IMasterPlanService _masterPlanService;
        private readonly IPlanService _planService;
        private readonly UserManager<AppUser> _userManager;
        private readonly INotificationService _notification;
        private readonly ICurrentUserService currentUserService;

        public PlanController(IMasterPlanService masterPlanService, IPlanService planService, UserManager<AppUser> UserManager,ICurrentUserService currentUserService,INotificationService notificationService)
        {
            _masterPlanService = masterPlanService;
            _planService = planService;
            _userManager = UserManager;
            _notification = notificationService;
            this.currentUserService = currentUserService;
        }

        [HttpPost]
        [Authorize(Policy = "Plans.Add")]

        public async Task<ActionResult<APIsGenralResponseDto<AddPlansDto>>> Add(AddPlansDto plan)
        {
            var g = await _masterPlanService.Add(plan);
            var user = await currentUserService.GetCurrentUserAsync();

            if (g is APIsGenralResponseDto<AddPlansDto> response)
            {
              await _notification.NotifyAsync(NotificationAction.BroadcastPlan, ModulesNamesOnArabic.Plan, null, FormNameToReturnToFront.plans, response.Data.Id, RoleEnum.Admin, plan.Name);
                return Ok(response);
            }
            else
            {
                return BadRequest("Failed to add plan");
            }

           
        }

        [HttpGet]
        [Authorize(Policy = "Plans.GetAll")]
        public async Task<ActionResult<APIsResponseFilterDto<GetAllPlanDto>>> GetAll(
            [FromQuery] int? Unit,
            [FromQuery] int? Year,
            [FromQuery] string Filter = "Current",
            [FromQuery] int Page = 1,
            [FromQuery] int PerPage = 5
        )
        {
            //var email = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            //var user = await _userManager.FindByEmailAsync(email);
            //var roles = await _userManager.GetRolesAsync(user);

            return await _planService.GetAll(Filter, Unit, Year, Page, PerPage);
        }
    }
}
