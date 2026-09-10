using Microsoft.AspNetCore.Identity;

namespace Mod.APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UnitsController(
        IUnitRepository unitRepository,
        ICurrentUserService currentUserService,
        IUnitsService _unitsService,
        ModContext context


    ) : ControllerBase
    {
        private readonly IUnitRepository _unitRepository = unitRepository;
        private readonly ICurrentUserService _currentUserService = currentUserService;
        private readonly IUnitsService _unitService = _unitsService;
        private readonly ModContext context = context;

        [Authorize(Policy = "Plans.GetAll")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Units>>> GetUnits()
        {
            var user = await _currentUserService.GetCurrentUserAsync();

            var units = await _unitRepository.GetUserUnits(user!);

            var unitsToReturn = units.Select(unit => new UnitsToReturnDto
            {
                Id = unit.Id,
                Name = unit.Name,
                RegionId = unit.RegionId,
            }).ToList();

            return Ok(new APIsGenralResponseDto<IEnumerable<UnitsToReturnDto>>(
                "Success",
                unitsToReturn
            ));
        }
        [Authorize(Policy = "Plans.GetOne")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUnitById(int id)
        {
            var unit = await _unitRepository.GetById(id);
            if (unit == null)
            {
                return NotFound(new APIsGenralResponseDto<string>("Unit not found", null));
            }
            var unitToReturn = new UnitsToReturnDto
            {
                Id = unit.Id,
                Name = unit.Name,
                RegionId = unit.RegionId,
            };
            return Ok(unitToReturn);
        }
        [Authorize(Policy = "Plans.Update")]
        [HttpPost("UpdateUnit")]
        public async Task<IActionResult> UpdateUnit([FromBody] UpdateUnitDto dto)
        {
            if (string.IsNullOrEmpty(dto.Name)) return BadRequest(new APIsGenralResponseDto<string>("Unit Name is Required", null));
            var unit = await _unitRepository.GetById(dto.Id);
            if (unit == null)
            {
                return NotFound(new APIsGenralResponseDto<string>("Unit not found", null));
            }
            unit.Name = dto.Name;

            context.Units.Update(unit);
            return Ok(new APIsGenralResponseDto<string>("Unit updated successfully", unit.Name));

        }

        [Authorize(Policy = "Plans.Add")]
        [HttpPost]
        public async Task<ActionResult<APIsGenralResponseDto<string>>> AddUnit([FromBody] AddUnitDto dto)
        {
            if (string.IsNullOrEmpty(dto.UnitName)) return new ActionResult<APIsGenralResponseDto<string>>(new APIsGenralResponseDto<string>("Unit Name is Required", null));
            var resualt = await _unitService.Add(dto.UnitName);
            return resualt;
        }
        [Authorize(Policy = "Plans.GetAll")]
        [HttpGet("All")]
        public async Task<IActionResult> GetAllUnitsWithoutPagination()
        {
            var units = await context.Units
                .Where(i => i.IsDeleted != true)
                .Select(u => new { u.Id, u.Name })
                .ToListAsync();

            return Ok(new APIsGenralResponseDto<object>("Success", units));
        }

        [Authorize(Policy = "Plans.GetAll")]
        [HttpGet("GetAllUnits")]
        public async Task<IActionResult> GetAllUsers([FromQuery] int perPage = 5, [FromQuery] int page = 1)
        {
            var units = await context.Units.Where(i => i.IsDeleted!=true)

                .ToListAsync();


            var unitsDtos = new List<object>();

            foreach (var user in units)
            {

                unitsDtos.Add(new
                {
                    Id = user.Id,
                    Name = user.Name,


                });
            }
            var totalCount = unitsDtos.Count;
            var totalPages = (int)Math.Ceiling((double)totalCount / perPage);

            // ���� �� �� ������ �� ��� �� 1
            page = page < 1 ? 1 : page;

            var paginatedBlogs = unitsDtos
                .Skip((page - 1) * perPage)
                .Take(perPage)
                .ToList();


            var metadata = new MetaDataDto
            {
                CurrentPage = page,
                PerPage = perPage,
                Total = totalCount,
                From = ((page - 1) * perPage) + 1,
                To = Math.Min(page * perPage, totalCount),
                LastPage = totalPages
            };

            return Ok(new APIsResponseFilterDto<Object>
            {
                Data = paginatedBlogs,
                Metadata = metadata
            });


        }

        [Authorize(Policy = "Plans.Delete")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUnit(int id)
        {
            var unit = await _unitRepository.GetById(id);
            if (unit == null)
            {
                return NotFound(new APIsGenralResponseDto<string>("Unit not found", null));
            }
            unit.IsDeleted = true;
            context.Units.Update(unit);
            await context.SaveChangesAsync();
            return Ok(new APIsGenralResponseDto<string>("Unit deleted successfully", unit.Name));
        }
    }


    public class UpdateUnitDto
    {
        public string Name { get; set; }
        public int Id { get; set; } 
    }
}
