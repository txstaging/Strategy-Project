using Mod.Core.Entities.Initiative;

namespace Mod.APIs.Controllers
{
    // «المعنيون بالمبادرات والمشاريع» — checklist item 23.
    //
    // Read-only. Gathers the people and parties already entered on each
    // initiative and project card: the officer in charge and the partners of an
    // initiative, the supervising authority and the beneficiaries of a project.
    // Nothing is stored here; editing stays on the cards themselves.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class StakeholdersController : ControllerBase
    {
        private readonly ModContext _context;
        private readonly ICurrentUserService _currentUser;

        public StakeholdersController(ModContext context, ICurrentUserService currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int? unitId, [FromQuery] int? planId, [FromQuery] string? search)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var q = search?.Trim();
            bool Matches(string? text) =>
                string.IsNullOrEmpty(q) || (text ?? "").Contains(q, StringComparison.OrdinalIgnoreCase);

            // ---- Initiatives ------------------------------------------------
            var initiativesQuery = _context.PlanInitiatives
                .Where(i => i.IsDeleted != true)
                .Include(i => i.Name)
                .Include(i => i.InitiativeItems)
                .Include(i => i.Unit)
                .Include(i => i.Plan)
                .Include(i => i.Goal).ThenInclude(g => g.Name)
                .AsQueryable();
            if (unitId is > 0) initiativesQuery = initiativesQuery.Where(i => i.UnitId == unitId);
            if (planId is > 0) initiativesQuery = initiativesQuery.Where(i => i.PlanId == planId);

            var initiatives = (await initiativesQuery.OrderBy(i => i.UnitId).ThenBy(i => i.Id).ToListAsync())
                .Select(i => new
                {
                    initiativeId = i.Id,
                    initiativeName = i.Name?.Value ?? "",
                    unitId = i.UnitId,
                    unitName = i.Unit?.Name,
                    planId = i.PlanId,
                    planName = i.Plan?.Name,
                    goalName = i.Goal?.Name?.Value,
                    // المسؤول عن المبادرة
                    adminsInCharge = i.InitiativeItems
                        .Where(x => x.Type == InitiativeItemType.AdminInCharge && x.IsDeleted != true)
                        .Select(x => x.Value).ToList(),
                    // شركاء التنفيذ
                    partners = i.InitiativeItems
                        .Where(x => x.Type == InitiativeItemType.Partner && x.IsDeleted != true)
                        .Select(x => x.Value).ToList(),
                })
                .Where(i => Matches(i.initiativeName)
                         || i.adminsInCharge.Any(Matches)
                         || i.partners.Any(Matches))
                .ToList();

            // ---- Projects ---------------------------------------------------
            var projectsQuery = _context.PlanProjects
                .Where(p => p.IsDeleted != true)
                .Include(p => p.Name)
                .Include(p => p.Beneficiaries)
                .Include(p => p.SupervisingAuthority)
                .Include(p => p.Units)
                .Include(p => p.Plan)
                .Include(p => p.Initiative).ThenInclude(i => i.Name)
                .AsQueryable();
            if (unitId is > 0) projectsQuery = projectsQuery.Where(p => p.UnitId == unitId);
            if (planId is > 0) projectsQuery = projectsQuery.Where(p => p.PlanId == planId);

            var projects = (await projectsQuery.OrderBy(p => p.UnitId).ThenBy(p => p.Id).ToListAsync())
                .Select(p => new
                {
                    projectId = p.Id,
                    projectName = p.Name?.Value ?? "",
                    code = p.Code,
                    unitId = p.UnitId,
                    unitName = p.Units?.Name,
                    planId = p.PlanId,
                    planName = p.Plan?.Name,
                    initiativeName = p.Initiative?.Name?.Value,
                    // الجهة المشرفة
                    supervisingAuthority = p.SupervisingAuthority?.Value,
                    // المستفيدون
                    beneficiaries = p.Beneficiaries?.Value,
                })
                .Where(p => Matches(p.projectName)
                         || Matches(p.supervisingAuthority)
                         || Matches(p.beneficiaries))
                .ToList();

            return Ok(new { initiatives, projects });
        }
    }
}
