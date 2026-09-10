using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Mod.APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
  
    public class BlogsController : ControllerBase
    {
        private readonly ModContext _context;
        private readonly IConfiguration _configuration;

        public BlogsController(ModContext context,IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }
        [HttpPost]
        public async Task<IActionResult> Add([FromForm] AddBlogDto dto)
        {
            try
            {
                if (!DateTime.TryParse(dto.Date, out DateTime parsedDate))
                {
                    return BadRequest("Invalid date format. Please use a format like yyyy-MM-dd.");
                }

                var blog = new Blogs
                {
                    Title = dto.Title,
                    Date = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc),

                    ImagePath = dto.Image != null ? Upload.UploadFile(dto.Image) : null,
                    Text = dto.Text,
                };

                _context.Blogs.Add(blog);
                await _context.SaveChangesAsync();

                return Ok(new APIsGenralResponseDto<string>("Success", "Blog added successfully"));
            }
            catch (Exception ex)
            {
                // Log the error (ex)
                return StatusCode(500, "An error occurred while saving the blog.");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var blog = await _context.Blogs.FindAsync(id);
            if (blog == null)
            {
                return NotFound();
            }
            var dto = new GetBlogDto
            {
                Id = blog.Id,
                Title = blog.Title,
                Date = blog.Date.ToString("yyyy-MM-dd"),
                ImagePath =$"https://localhost:7175/{blog.ImagePath}" ,
                Text = blog.Text,
                Status = blog.Status
            };
            return Ok(new APIsGenralResponseDto<GetBlogDto>("Success", dto));
        }
        [HttpPost("Update")]
        public async Task<IActionResult> Update([FromForm] UpdateBlogDto dto)
        {
            var blog = await _context.Blogs.FindAsync(dto.Id);
            if (blog == null)
            {
                return NotFound();
            }
            if (!DateTime.TryParse(dto.Date, out DateTime parsedDate))
            {
                
            }
            if(dto.Title!=null)
            {
                blog.Title = dto.Title;
            }
            if (dto.Date != null)
            {
                blog.Date = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);
            }
        
            
            if (dto.Image != null)
            {
                blog.ImagePath = Upload.UploadFile(dto.Image);
            }
            if (dto.Text != null)
            {
                blog.Text = dto.Text;
            }
            if (dto.Status != null)
            {
                blog.Status = (bool)dto.Status;
            }

            
           
            _context.Blogs.Update(blog);
            await _context.SaveChangesAsync();
            return Ok(new APIsGenralResponseDto<UpdateBlogDto>("Success", null));
        }
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int perPage = 5, [FromQuery] int page = 1) // البداية من 1 بدل 0
        {
            var blogs = await _context.Blogs
                .Where(b => b.Status) // التصفية في قاعدة البيانات بدلاً من الذاكرة
                .ToListAsync();

            var totalCount = blogs.Count;
            var totalPages = (int)Math.Ceiling((double)totalCount / perPage);

            // تأكد من أن الصفحة لا تقل عن 1
            page = page < 1 ? 1 : page;

            var paginatedBlogs = blogs
                .Skip((page - 1) * perPage)
                .Take(perPage)
                .ToList();

            foreach (var item in paginatedBlogs)
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

            return Ok(new APIsResponseFilterDto<Blogs>
            {
                Data = paginatedBlogs,
                Metadata = metadata
            });
        }
        [HttpGet("V2")]
        public async Task<IActionResult> GetAllv2([FromQuery] int perPage = 5, [FromQuery] int page = 1) // البداية من 1 بدل 0
        {
            var blogs = await _context.Blogs
                // التصفية في قاعدة البيانات بدلاً من الذاكرة
                .ToListAsync();

            var totalCount = blogs.Count;
            var totalPages = (int)Math.Ceiling((double)totalCount / perPage);

            // تأكد من أن الصفحة لا تقل عن 1
            page = page < 1 ? 1 : page;

            var paginatedBlogs = blogs
                .Skip((page - 1) * perPage)
                .Take(perPage)
                .ToList();

            foreach (var item in paginatedBlogs)
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

            return Ok(new APIsResponseFilterDto<Blogs>
            {
                Data = paginatedBlogs,
                Metadata = metadata
            });
        }

        [HttpPost("UpdateAllStatus")]
        public async Task<IActionResult>updatestatus()
        {
            var blogs = await _context.Blogs.Where(i=>i.Status).ToListAsync();
            foreach (var item in blogs)
            {
                item.Status = false;
                _context.Blogs.Update(item);

            }
            _context.SaveChanges();
            return Ok(new { message = "ok" });

        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var blog = await _context.Blogs.FindAsync(id);
            if (blog == null)
            {
                return NotFound();
            }
            _context.Blogs.Remove(blog);
            await _context.SaveChangesAsync();
            return Ok(new APIsGenralResponseDto<string>("Success", "Blog deleted successfully"));
        }
    }
}
