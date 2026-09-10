namespace Mod.APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PageTitleController : ControllerBase
    {
        private readonly ModContext _context;

        public PageTitleController(ModContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var titles = await _context.PageTitles.Select(t => new
            {
                t.Id,
                t.Key,
                t.PageName,
                t.DefaultValue,
                t.CurrentValue
            }).ToListAsync();

            return Ok(new { titles });
        }

        [HttpPost("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePageTitleDto dto)
        {
            var title = await _context.PageTitles.FindAsync(id);
            if (title == null)
                return NotFound();

            title.CurrentValue = dto.CurrentValue;
            title.UpdatedAt = DateTime.UtcNow;
            _context.PageTitles.Update(title);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/reset")]
        public async Task<IActionResult> Reset(int id)
        {
            var title = await _context.PageTitles.FindAsync(id);
            if (title == null)
                return NotFound();

            title.CurrentValue = title.DefaultValue;
            title.UpdatedAt = DateTime.UtcNow;
            _context.PageTitles.Update(title);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("reset-all")]
        public async Task<IActionResult> ResetAll()
        {
            var titles = await _context.PageTitles.ToListAsync();
            foreach (var title in titles)
            {
                title.CurrentValue = title.DefaultValue;
                title.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class UpdatePageTitleDto
    {
        public string CurrentValue { get; set; }
    }
}
