using Mod.Core.DTOs.ProjectAllocation;

namespace Mod.APIs.Controllers
{
    // «إدارة الموارد والميزانيات والعقود» — checklist item 22. Every project
    // with the resources, budget lines and contracts allocated to it, filtered
    // by unit or by name. Lines are added and removed in place.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProjectAllocationController : ControllerBase
    {
        private readonly ModContext _context;
        private readonly ICurrentUserService _currentUser;

        public ProjectAllocationController(ModContext context, ICurrentUserService currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

        // The whole screen in one call: projects, optionally narrowed to a unit
        // or a plan or a search term, each carrying its allocations.
        [HttpGet("projects")]
        public async Task<IActionResult> Projects([FromQuery] int? unitId, [FromQuery] int? planId, [FromQuery] string? search)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var query = _context.PlanProjects
                .Where(p => p.IsDeleted != true)
                .Include(p => p.Name)
                .Include(p => p.Percentage)
                .Include(p => p.Units)
                .Include(p => p.Plan)
                .AsQueryable();

            if (unitId is > 0) query = query.Where(p => p.UnitId == unitId);
            if (planId is > 0) query = query.Where(p => p.PlanId == planId);

            var projects = await query.OrderBy(p => p.UnitId).ThenBy(p => p.Id).ToListAsync();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim();
                projects = projects
                    .Where(p => (p.Name?.Value ?? "").Contains(q, StringComparison.OrdinalIgnoreCase)
                             || (p.Code ?? "").Contains(q, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            var ids = projects.Select(p => p.Id).ToList();
            var allocations = await _context.ProjectAllocations
                .Where(a => ids.Contains(a.ProjectId) && a.IsDeleted != true)
                .OrderBy(a => a.Id)
                .ToListAsync();
            var byProject = allocations.GroupBy(a => a.ProjectId).ToDictionary(g => g.Key, g => g.ToList());

            var rows = projects.Select(p =>
            {
                var mine = byProject.TryGetValue(p.Id, out var list) ? list : new List<ProjectAllocation>();
                var budgets = mine.Where(a => a.Kind == AllocationKind.Budget).Select(Map).ToList();
                var contracts = mine.Where(a => a.Kind == AllocationKind.Contract).Select(Map).ToList();

                return new ProjectAllocationsDto
                {
                    ProjectId = p.Id,
                    ProjectName = p.Name?.Value ?? "",
                    Code = p.Code,
                    UnitId = p.UnitId,
                    UnitName = p.Units?.Name,
                    PlanId = p.PlanId,
                    PlanName = p.Plan?.Name,
                    Percentage = double.TryParse(p.Percentage?.Value, out var pct) ? pct : null,
                    Resources = mine.Where(a => a.Kind == AllocationKind.Resource).Select(Map).ToList(),
                    Budgets = budgets,
                    Contracts = contracts,
                    BudgetTotal = budgets.Sum(b => b.Amount ?? 0),
                    ContractTotal = contracts.Sum(c => c.Amount ?? 0),
                };
            }).ToList();

            return Ok(rows);
        }

        [HttpPost]
        public async Task<IActionResult> Add([FromBody] SaveAllocationDto dto)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "الاسم مطلوب" });
            if (dto.Amount is < 0)
                return BadRequest(new { message = "المبلغ لا يمكن أن يكون سالباً" });

            var exists = await _context.PlanProjects.AnyAsync(p => p.Id == dto.ProjectId && p.IsDeleted != true);
            if (!exists) return NotFound(new { message = "المشروع غير موجود" });

            var allocation = new ProjectAllocation
            {
                ProjectId = dto.ProjectId,
                Kind = dto.Kind,
                Name = dto.Name.Trim(),
                Amount = dto.Amount,
                Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
                CreatedByUserId = user.Id,
            };
            _context.ProjectAllocations.Add(allocation);
            await _context.SaveChangesAsync();

            return Ok(Map(allocation));
        }

        // Soft delete, so a line removed from the screen stays on record.
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var allocation = await _context.ProjectAllocations.FirstOrDefaultAsync(a => a.Id == id && a.IsDeleted != true);
            if (allocation == null) return NotFound(new { message = "السجل غير موجود" });

            allocation.IsDeleted = true;
            allocation.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "ok" });
        }

        private static AllocationDto Map(ProjectAllocation a) => new()
        {
            Id = a.Id,
            Kind = a.Kind,
            Name = a.Name,
            Amount = a.Amount,
            Notes = a.Notes,
        };
    }
}
