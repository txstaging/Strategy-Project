using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Mod.APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlanStatusController : ControllerBase
    {
        private readonly ModContext _context;

        public PlanStatusController(ModContext context)
        {
            _context = context;
        }
        [HttpGet("{planId}")]
        [Authorize(Policy = "Plans.GetOne")]
        public async Task<IActionResult> GetPlanStatus(int planId)
        {
            var plan = await _context.Plans.FindAsync(planId);
            if (plan == null)
            {
                return NotFound();
            }
            // A stage is unlocked once the plan has reached it, so the flags are
            // cumulative. This replaces five near-identical if blocks that also had
            // no Reports flag, which is why the reports stage could never unlock.
            var reached = (int)plan.CurrentStage;
            var o = new PlanStatus
            {
                AnalysisStage = reached >= (int)StrategicPlanLevels.AnalysisStage,
                DirectionStage = reached >= (int)StrategicPlanLevels.DirectionStage,
                GoalsStage = reached >= (int)StrategicPlanLevels.GoalsStage,
                InitiativesStage = reached >= (int)StrategicPlanLevels.InitiativesStage,
                ProjectsStage = reached >= (int)StrategicPlanLevels.ProjectsStage,
                ReportStage = reached >= (int)StrategicPlanLevels.ReportStage,
            };
            return Ok(o);
        }
    }
}
