using Microsoft.EntityFrameworkCore;
using QuestPDF.Infrastructure;

namespace Mod.APIs.Controllers
{
    [Authorize]
    [Route("/api/Plans/{PlanId}/Analysis/Points")]
    public class AnalysisPointsController(IAnalysisPointsService analysisPointsService, ICurrentUserService currentUser,ModContext context,INotificationService notificationService) : BaseController
    {
        private readonly IAnalysisPointsService _analysisPointsService = analysisPointsService;
        private readonly ICurrentUserService _currentUser = currentUser;
        private readonly ModContext context = context;
        private readonly INotificationService _notification = notificationService;

        [Authorize(Policy = "Analysis.Approve")]
        [HttpPost("Approve")]
        public async Task<IActionResult>convert(int PlanId)
        {
            var a=await context.AnalysisPoints.Where(i=>i.PlanId== PlanId).ToListAsync();
            var cuurrentUser = await _currentUser.GetCurrentUserAsync();
            var unit= await context.Units.FirstOrDefaultAsync(i => i.Id == cuurrentUser.UnitId);
            foreach (var i in a)
            {
                if(i.Status==ApprovalStatus.SavedAsDraft)
                {
                    i.Status = ApprovalStatus.Pending;
                    context.SaveChanges();
                }
            }
            await _notification.NotifyAsync(NotificationAction.Submit, ModulesNamesOnArabic.Analsis, unit, FormNameToReturnToFront.analysisstage, PlanId, RoleEnum.UnitEmployee);

            return Ok(new { PlanID = PlanId });
        }

		[Authorize(Policy = "Analysis.GetAll")]
		[HttpGet]
        public async Task<ActionResult<APIsResponseFilterDto<AddAnalysisPointsDto>>> GetAll( int PlanId,  [FromQuery] string? type, [FromQuery] int perPage=5, [FromQuery] int page=0)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var result = await _analysisPointsService.GetAll(PlanId, page, perPage, type, user);
            return Ok(result);
        }
        [Authorize(Policy = "Analysis.GetAll")]
        [HttpGet("GetAllV2")]
        public async Task<ActionResult<APIsResponseFilterDto<AddAnalysisPointsDto>>> GetAllV2(int PlanId)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var result = await _analysisPointsService.GetAllV2(PlanId ,user);
            return Ok(result);
        }

        [Authorize(Policy = "Analysis.Add")]
        [HttpPost]
        public async Task<ActionResult<APIsGenralResponseDto<AddAnalysisPointsDto>>> Add([FromBody] AddAnalysisPointsDto point, int PlanId)
        {
            var user = await _currentUser.GetCurrentUserAsync(); 
            var result = await _analysisPointsService.Add(point, user, PlanId);
            return Ok(result);
        }

        [Authorize(Policy = "Analysis.GetOne")]
        [HttpGet("{id}")]
        public async Task<ActionResult<APIsGenralResponseDto<AddAnalysisPointsDto>>> GetById(int id)
        {
            var result = await _analysisPointsService.GetById(id);
            return Ok(result);
        }

        [Authorize(Policy = "Analysis.Update")]
        [HttpPost("{id}")]
        public async Task<ActionResult<APIsGenralResponseDto<AddAnalysisPointsDto>>> Update([FromBody] AddAnalysisPointsDto point,int PlanId,int id)
        {
            var result = await _analysisPointsService.Update(point,PlanId,id);
            return Ok(result);
        }
        
        [Authorize(Policy = "Analysis.Delete")]
        [HttpDelete("{id}")]
        public async Task<ActionResult<APIsGenralResponseDto<AddAnalysisPointsDto>>> Delete(int id, int PlanID)
        {
            return Ok(await _analysisPointsService.Delete(id,PlanID));
        }

		[Authorize(Policy = "Analysis.Approve")]
		[HttpPost("{pointId}/Approve")]
        public async Task<ActionResult<APIsGenralResponseDto<AddAnalysisPointsDto>>> Approve(int PlanId, int pointId)
        {
            var user = await _currentUser.GetCurrentUserAsync(); 
            var result = await _analysisPointsService.Approve(PlanId, pointId, user);
            return Ok(result);
        }
        
        [Authorize(Policy = "Analysis.Reject")]
        [HttpPost("{pointId}/Reject")]
        public async Task<ActionResult<APIsGenralResponseDto<AddAnalysisPointsDto>>> Reject(int PlanId, int pointId, [FromBody] ReturnAnalysisPointToEmployee comment)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var result = await _analysisPointsService.Reject(PlanId, pointId, comment, user);
            var plan = await context.Plans.Include(p => p.Units).FirstOrDefaultAsync(p => p.Id == PlanId);
            var unit = plan?.Units ?? await context.Units.Where(i => i.Id == user.UnitId).FirstOrDefaultAsync();
            var actingRole = Enum.Parse<RoleEnum>(user.Role);
            await _notification.NotifyAsync(NotificationAction.Reject, ModulesNamesOnArabic.Analsis, unit, FormNameToReturnToFront.analysisstage, PlanId, actingRole);
            return Ok(result);
        }

        [Authorize(Policy = "Analysis.Return")]
        [HttpPost("{pointId}/Return")]
        public async Task<ActionResult<APIsGenralResponseDto<AddAnalysisPointsDto>>> Return(int PlanId, int pointId, [FromBody] ReturnAnalysisPointToEmployee comment)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var result = await _analysisPointsService.ReturnToEdit(PlanId, user, pointId, comment);
            var plan = await context.Plans.Include(p => p.Units).FirstOrDefaultAsync(p => p.Id == PlanId);
            var unit = plan?.Units ?? await context.Units.Where(i => i.Id == user.UnitId).FirstOrDefaultAsync();
            var actingRole = Enum.Parse<RoleEnum>(user.Role);
            await _notification.NotifyAsync(NotificationAction.Return, ModulesNamesOnArabic.Analsis, unit, FormNameToReturnToFront.analysisstage, PlanId, actingRole);
            return Ok(result);
        }
    }
}
