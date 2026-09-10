using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Mod.APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]

    public class OurMessagesController : ControllerBase
    {
        private readonly ModContext _context;
        private readonly IConfiguration _configuration;

        public OurMessagesController(ModContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }
        [HttpPost]
        public async Task<IActionResult> Add([FromForm] AddOurMessagesDto dto)
        {
            try
            {
                if (!DateTime.TryParse(dto.Date, out DateTime parsedDate))
                {
                    return BadRequest("Invalid date format. Please use a format like yyyy-MM-dd.");
                }

                var entity = new OurMessages
                {
                    Title = dto.Title,
                    Date = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc),
                    ImagePath = dto.Image != null ? Upload.UploadFile(dto.Image) : null,
                    Text = dto.Text,
                };

                _context.OurMessages.Add(entity);
                await _context.SaveChangesAsync();

                return Ok(new APIsGenralResponseDto<string>("Success", "OurMessages added successfully"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while saving.");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var entity = await _context.OurMessages.FindAsync(id);
            if (entity == null)
            {
                return NotFound();
            }
            var dto = new GetOurMessagesDto
            {
                Id = entity.Id,
                Title = entity.Title,
                Date = entity.Date.ToString("yyyy-MM-dd"),
                ImagePath = $"https://localhost:7175/{entity.ImagePath}",
                Text = entity.Text,
                Status = entity.Status
            };
            return Ok(new APIsGenralResponseDto<GetOurMessagesDto>("Success", dto));
        }
        [HttpPost("Update")]
        public async Task<IActionResult> Update([FromForm] UpdateOurMessagesDto dto)
        {
            var entity = await _context.OurMessages.FindAsync(dto.Id);
            if (entity == null)
            {
                return NotFound();
            }
            if (!DateTime.TryParse(dto.Date, out DateTime parsedDate))
            {

            }
            if (dto.Title != null)
            {
                entity.Title = dto.Title;
            }
            if (dto.Date != null)
            {
                entity.Date = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);
            }

            if (dto.Image != null)
            {
                entity.ImagePath = Upload.UploadFile(dto.Image);
            }
            if (dto.Text != null)
            {
                entity.Text = dto.Text;
            }
            if (dto.Status != null)
            {
                entity.Status = (bool)dto.Status;
            }

            _context.OurMessages.Update(entity);
            await _context.SaveChangesAsync();
            return Ok(new APIsGenralResponseDto<UpdateOurMessagesDto>("Success", null));
        }
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int perPage = 5, [FromQuery] int page = 1)
        {
            var items = await _context.OurMessages
                .Where(b => b.Status)
                .ToListAsync();

            var totalCount = items.Count;
            var totalPages = (int)Math.Ceiling((double)totalCount / perPage);

            page = page < 1 ? 1 : page;

            var paginatedItems = items
                .Skip((page - 1) * perPage)
                .Take(perPage)
                .ToList();

            foreach (var item in paginatedItems)
            {
                item.ImagePath = $"https://localhost:7175/{item.ImagePath}";
            }

            var metadata = new MetaDataDto
            {
                CurrentPage = page,
                PerPage = perPage,
                Total = totalCount,
                From = ((page - 1) * perPage) + 1,
                To = Math.Min(page * perPage, totalCount),
                LastPage = totalPages
            };

            return Ok(new APIsResponseFilterDto<OurMessages>
            {
                Data = paginatedItems,
                Metadata = metadata
            });
        }
        [HttpGet("V2")]
        public async Task<IActionResult> GetAllv2([FromQuery] int perPage = 5, [FromQuery] int page = 1)
        {
            var items = await _context.OurMessages
                .ToListAsync();

            var totalCount = items.Count;
            var totalPages = (int)Math.Ceiling((double)totalCount / perPage);

            page = page < 1 ? 1 : page;

            var paginatedItems = items
                .Skip((page - 1) * perPage)
                .Take(perPage)
                .ToList();

            foreach (var item in paginatedItems)
            {
                item.ImagePath = $"https://mod-sa.dev-env.live:5050/{item.ImagePath}";
            }

            var metadata = new MetaDataDto
            {
                CurrentPage = page,
                PerPage = perPage,
                Total = totalCount,
                From = ((page - 1) * perPage) + 1,
                To = Math.Min(page * perPage, totalCount),
                LastPage = totalPages
            };

            return Ok(new APIsResponseFilterDto<OurMessages>
            {
                Data = paginatedItems,
                Metadata = metadata
            });
        }

        [HttpPost("UpdateAllStatus")]
        public async Task<IActionResult> UpdateStatus()
        {
            var items = await _context.OurMessages.Where(i => i.Status).ToListAsync();
            foreach (var item in items)
            {
                item.Status = false;
                _context.OurMessages.Update(item);
            }
            _context.SaveChanges();
            return Ok(new { message = "ok" });
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _context.OurMessages.FindAsync(id);
            if (entity == null)
            {
                return NotFound();
            }
            _context.OurMessages.Remove(entity);
            await _context.SaveChangesAsync();
            return Ok(new APIsGenralResponseDto<string>("Success", "OurMessages deleted successfully"));
        }
    }
}
