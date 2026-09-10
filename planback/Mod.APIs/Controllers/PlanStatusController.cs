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
            var o = new PlanStatus();
            if(plan.CurrentStage==StrategicPlanLevels.AnalysisStage)
            {
                o.AnalysisStage = true;
                o.DirectionStage = false;
                o.GoalsStage = false;
                o.InitiativesStage = false;
                o.ProjectsStage = false;


            }
            if(plan.CurrentStage == StrategicPlanLevels.DirectionStage)
            {
                o.AnalysisStage = true;
                o.DirectionStage = true;
                o.GoalsStage = false;
                o.InitiativesStage = false;
                o.ProjectsStage = false;
            }
            if (plan.CurrentStage == StrategicPlanLevels.GoalsStage)
            {
                o.AnalysisStage = true;
                o.DirectionStage = true;
                o.GoalsStage = true;
                o.InitiativesStage = false;
                o.ProjectsStage = false;
            }
            if (plan.CurrentStage == StrategicPlanLevels.InitiativesStage)
            {
                o.AnalysisStage = true;
                o.DirectionStage = true;
                o.GoalsStage = true;
                o.InitiativesStage = true;
                o.ProjectsStage = false;
            }
            if (plan.CurrentStage == StrategicPlanLevels.ProjectsStage)
            {
                o.AnalysisStage = true;
                o.DirectionStage = true;
                o.GoalsStage = true;
                o.InitiativesStage = true;
                o.ProjectsStage = true;
            }
            return Ok(o);
        }
    }
}
