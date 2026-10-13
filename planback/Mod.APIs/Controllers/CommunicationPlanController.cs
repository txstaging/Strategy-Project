using Mod.Core.DTOs.CommunicationPlan;

namespace Mod.APIs.Controllers
{
    // «خطة التواصل والمجازفات» — checklist item 21. A per-plan sheet of contacts
    // made and actions taken. Rows are added, edited and removed in place.
    //
    // Sending the sheet to someone for their views is not here: it goes through
    // FeedbackController with the communication subject, so the notification,
    // the reply and the waiting all come from the existing feedback engine.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CommunicationPlanController : ControllerBase
    {
        private readonly ModContext _context;
        private readonly ICurrentUserService _currentUser;

        public CommunicationPlanController(ModContext context, ICurrentUserService currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int planId)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var rows = await _context.CommunicationPlanEntries
                .Where(e => e.PlanId == planId && e.IsDeleted != true)
                .Include(e => e.CreatedByUser)
                .Include(e => e.Unit)
                .OrderBy(e => e.Date).ThenBy(e => e.Id)
                .ToListAsync();

            return Ok(rows.Select(Map).ToList());
        }

        [HttpPost]
        public async Task<IActionResult> Add([FromBody] SaveCommunicationPlanEntryDto dto)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var error = Validate(dto);
            if (error != null) return BadRequest(new { message = error });

            var plan = await _context.Plans.FirstOrDefaultAsync(p => p.Id == dto.PlanId);
            if (plan == null) return NotFound(new { message = "الخطة غير موجودة" });

            var entry = new CommunicationPlanEntry
            {
                PlanId = dto.PlanId,
                Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc),
                Channel = dto.Channel.Trim(),
                Method = dto.Method,
                ResponsibleOfficer = dto.ResponsibleOfficer.Trim(),
                ActionTaken = dto.ActionTaken.Trim(),
                CreatedByUserId = user.Id,
                UnitId = user.UnitId,
            };
            _context.CommunicationPlanEntries.Add(entry);
            await _context.SaveChangesAsync();

            await _context.Entry(entry).Reference(e => e.CreatedByUser).LoadAsync();
            await _context.Entry(entry).Reference(e => e.Unit).LoadAsync();
            return Ok(Map(entry));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] SaveCommunicationPlanEntryDto dto)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var error = Validate(dto);
            if (error != null) return BadRequest(new { message = error });

            var entry = await _context.CommunicationPlanEntries
                .Include(e => e.CreatedByUser)
                .Include(e => e.Unit)
                .FirstOrDefaultAsync(e => e.Id == id && e.IsDeleted != true);
            if (entry == null) return NotFound(new { message = "السجل غير موجود" });

            entry.Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc);
            entry.Channel = dto.Channel.Trim();
            entry.Method = dto.Method;
            entry.ResponsibleOfficer = dto.ResponsibleOfficer.Trim();
            entry.ActionTaken = dto.ActionTaken.Trim();
            entry.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(Map(entry));
        }

        // Soft delete, so a row taken off the sheet stays on record.
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var entry = await _context.CommunicationPlanEntries.FirstOrDefaultAsync(e => e.Id == id && e.IsDeleted != true);
            if (entry == null) return NotFound(new { message = "السجل غير موجود" });

            entry.IsDeleted = true;
            entry.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "ok" });
        }

        private static string? Validate(SaveCommunicationPlanEntryDto dto)
        {
            if (dto.PlanId <= 0) return "الخطة مطلوبة";
            if (dto.Date == default) return "التاريخ مطلوب";
            if (string.IsNullOrWhiteSpace(dto.Channel)) return "قناة التواصل مطلوبة";
            if (string.IsNullOrWhiteSpace(dto.ResponsibleOfficer)) return "الضابط المسؤول مطلوب";
            if (string.IsNullOrWhiteSpace(dto.ActionTaken)) return "الإجراء المتخذ مطلوب";
            return null;
        }

        private static CommunicationPlanEntryDto Map(CommunicationPlanEntry e) => new()
        {
            Id = e.Id,
            PlanId = e.PlanId,
            Date = e.Date,
            Channel = e.Channel,
            Method = e.Method,
            ResponsibleOfficer = e.ResponsibleOfficer,
            ActionTaken = e.ActionTaken,
            CreatedByName = e.CreatedByUser?.DisplayName,
            UnitName = e.Unit?.Name,
            CreatedAt = e.CreatedAt,
        };
    }
}
