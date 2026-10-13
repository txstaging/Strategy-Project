using Mod.Core.DTOs.SharedProjects;

namespace Mod.APIs.Controllers
{
    // «قائمة المشاريع المشتركة» — checklist item 24. Projects that more than
    // one department takes part in, with each participant and what it commits
    // to do. Participants are added, edited and removed in place.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SharedProjectsController : ControllerBase
    {
        private readonly ModContext _context;
        private readonly ICurrentUserService _currentUser;

        public SharedProjectsController(ModContext context, ICurrentUserService currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

        // The whole screen in one call. onlyShared keeps to projects that already
        // have participants; turn it off to add the first participant to any project.
        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int? unitId, [FromQuery] int? planId, [FromQuery] string? search, [FromQuery] bool onlyShared = true)
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
            if (planId is > 0) query = query.Where(p => p.PlanId == planId);

            var projects = await query.OrderBy(p => p.UnitId).ThenBy(p => p.Id).ToListAsync();

            var ids = projects.Select(p => p.Id).ToList();
            var participants = await _context.SharedProjectParticipants
                .Where(x => ids.Contains(x.ProjectId) && x.IsDeleted != true)
                .Include(x => x.Unit)
                .OrderBy(x => x.Id)
                .ToListAsync();
            var byProject = participants.GroupBy(x => x.ProjectId).ToDictionary(g => g.Key, g => g.ToList());

            var q = search?.Trim();
            bool Matches(string? text) =>
                string.IsNullOrEmpty(q) || (text ?? "").Contains(q, StringComparison.OrdinalIgnoreCase);

            var rows = projects
                .Select(p =>
                {
                    var mine = byProject.TryGetValue(p.Id, out var list) ? list : new List<SharedProjectParticipant>();
                    return new SharedProjectDto
                    {
                        ProjectId = p.Id,
                        ProjectName = p.Name?.Value ?? "",
                        Code = p.Code,
                        UnitId = p.UnitId,
                        UnitName = p.Units?.Name,
                        PlanId = p.PlanId,
                        PlanName = p.Plan?.Name,
                        Percentage = double.TryParse(p.Percentage?.Value, out var pct) ? pct : null,
                        Participants = mine.Select(Map).ToList(),
                    };
                })
                // A unit filter matches the owning unit OR any participating unit,
                // since a shared project belongs to everyone taking part.
                .Where(r => unitId is not > 0
                         || r.UnitId == unitId
                         || r.Participants.Any(x => x.UnitId == unitId))
                .Where(r => !onlyShared || r.Participants.Count > 0)
                .Where(r => Matches(r.ProjectName)
                         || Matches(r.Code)
                         || r.Participants.Any(x => Matches(x.DisplayName) || Matches(x.Contribution)))
                .ToList();

            return Ok(rows);
        }

        [HttpPost]
        public async Task<IActionResult> Add([FromBody] SaveParticipantDto dto)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var error = await ValidateAsync(dto);
            if (error != null) return BadRequest(new { message = error });

            var participant = new SharedProjectParticipant
            {
                ProjectId = dto.ProjectId,
                UnitId = dto.UnitId is > 0 ? dto.UnitId : null,
                PartyName = dto.UnitId is > 0 ? null : dto.PartyName?.Trim(),
                ContributionType = dto.ContributionType,
                Contribution = dto.Contribution.Trim(),
                Amount = dto.ContributionType == ContributionType.Budget ? dto.Amount : null,
                Status = dto.Status,
                Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
                CreatedByUserId = user.Id,
            };
            _context.SharedProjectParticipants.Add(participant);
            await _context.SaveChangesAsync();

            await _context.Entry(participant).Reference(x => x.Unit).LoadAsync();
            return Ok(Map(participant));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] SaveParticipantDto dto)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var error = await ValidateAsync(dto);
            if (error != null) return BadRequest(new { message = error });

            var participant = await _context.SharedProjectParticipants
                .Include(x => x.Unit)
                .FirstOrDefaultAsync(x => x.Id == id && x.IsDeleted != true);
            if (participant == null) return NotFound(new { message = "المشترك غير موجود" });

            participant.UnitId = dto.UnitId is > 0 ? dto.UnitId : null;
            participant.PartyName = dto.UnitId is > 0 ? null : dto.PartyName?.Trim();
            participant.ContributionType = dto.ContributionType;
            participant.Contribution = dto.Contribution.Trim();
            participant.Amount = dto.ContributionType == ContributionType.Budget ? dto.Amount : null;
            participant.Status = dto.Status;
            participant.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
            participant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _context.Entry(participant).Reference(x => x.Unit).LoadAsync();
            return Ok(Map(participant));
        }

        // Soft delete, so a participant taken off a project stays on record.
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var participant = await _context.SharedProjectParticipants.FirstOrDefaultAsync(x => x.Id == id && x.IsDeleted != true);
            if (participant == null) return NotFound(new { message = "المشترك غير موجود" });

            participant.IsDeleted = true;
            participant.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "ok" });
        }

        private async Task<string?> ValidateAsync(SaveParticipantDto dto)
        {
            if (dto.UnitId is not > 0 && string.IsNullOrWhiteSpace(dto.PartyName))
                return "اختر وحدة أو اكتب اسم الجهة المشتركة";
            if (string.IsNullOrWhiteSpace(dto.Contribution))
                return "الإجراء أو المساهمة مطلوبة";
            if (dto.Amount is < 0)
                return "المبلغ لا يمكن أن يكون سالباً";

            var exists = await _context.PlanProjects.AnyAsync(p => p.Id == dto.ProjectId && p.IsDeleted != true);
            if (!exists) return "المشروع غير موجود";

            if (dto.UnitId is > 0 && !await _context.Units.AnyAsync(u => u.Id == dto.UnitId && u.IsDeleted != true))
                return "الوحدة غير موجودة";

            return null;
        }

        private static ParticipantDto Map(SharedProjectParticipant x) => new()
        {
            Id = x.Id,
            UnitId = x.UnitId,
            UnitName = x.Unit?.Name,
            PartyName = x.PartyName,
            DisplayName = x.Unit?.Name ?? x.PartyName ?? "",
            ContributionType = x.ContributionType,
            Contribution = x.Contribution,
            Amount = x.Amount,
            Status = x.Status,
            Notes = x.Notes,
        };
    }
}
