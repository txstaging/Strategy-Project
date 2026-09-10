using Mod.Core.Mapping.PlanDirection;
using Mod.Core.Utils;
using QuestPDF.Infrastructure;
using System.Drawing;
using DirectionItemsElements = Mod.Core.Entities.StrategicPlan.DirectionItemsElements;

namespace Mod.APIs.Controllers
{
    [Route("/api/Plans/{PlanId}/Direction/Items")]
    [ApiController]
    public class DirectionItemsController : BaseController
    {

        private readonly ICurrentUserService _currentUser;
        private readonly ModContext _context;
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notification;

        public DirectionItemsController(ICurrentUserService currentUser, ModContext context, IUnitOfWork unitOfWork,INotificationService notificationService)
        {

            _currentUser = currentUser;
            _context = context;
            _unitOfWork = unitOfWork;
            _notification = notificationService;
        }
        [Authorize(Policy = "Direction.Approve")]
        [HttpPost("Convert")]
        public async Task<IActionResult> convert(int PlanId)
        {
            var a = await _context.DirectionItems.Where(i => i.PlanDirection.PlanId == PlanId).Include(i=>i.DirectionItemsElements).ToListAsync();
            var currentUser = await _currentUser.GetCurrentUserAsync();
            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == currentUser.UnitId);
            foreach (var i in a)
            {
                if (i.Status == ApprovalStatus.SavedAsDraft||i.Status==ApprovalStatus.Pending)
                {
                    i.Status = ApprovalStatus.Pending;
                    _context.DirectionItems.Update(i);
                    foreach (var item in i.DirectionItemsElements)
                    {
                        item.Status = ApprovalStatus.Pending;
                        _context.DirectionItemsElements.Update(item);
                    }
                }
            }
            _context.SaveChanges();
            await _notification.NotifyAsync(NotificationAction.Submit, ModulesNamesOnArabic.Direction, unit, FormNameToReturnToFront.directionstage, PlanId, RoleEnum.UnitEmployee);
            return Ok(new { PlanID = PlanId });
        }

        [Authorize(Policy = "Direction.Add")]
        [HttpPost]
        public async Task<ActionResult<APIsGenralResponseDto<AddDirectionItemsDto>>> AddDirectionItem([FromBody] AddDirectionItemsDto element, int PlanId)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (element == null || PlanId <= 0)
            {
                return BadRequest("Invalid input.");
            }

            // Parse the string to the enum type  
            if (!Enum.TryParse<StrategicDirectionPointType>(element.Type, out var parsedType))
            {
                return BadRequest("Invalid type value.");
            }
            var plan = await _context.Plans.Where(i=>i.Id==PlanId).Include(i=>i.PlanDirection).FirstOrDefaultAsync(i=>i.Id==PlanId);

          
            var result = new DirectionItems
            {
                Name = element.Name,
                Type = parsedType,
                DirectionItemsElements = element.DirectionItemsElements.Select(e => new DirectionItemsElements
                {
                    Name = e.Name,
                    Status  = Utils.GetApprovalStatus(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!)),

                    



                }).ToList(),
                
                PlanDirectionId = plan.PlanDirectionId,
                PlanDirection = plan.PlanDirection,
                Status  = Utils.GetApprovalStatus(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!))





            };
          

            //foreach (var item in result.DirectionItemsElements)
            //{
            //    item.DirectionItems = result; // Set the DirectionItems reference
            //    item.DirectionItemsId = result.Id; // Set the foreign key

            //}
            _context.DirectionItems.Add(result);
            _context.SaveChanges();


            return Ok(new { Message = "Added" });

        }


        [Authorize(Policy = "Direction.GetOne")]
        [HttpGet("{id}")]
        public async Task<ActionResult<APIsGenralResponseDto<AddDirectionItemsDto>>> GetDirectionItem(int id)
        {

            var result = await _context.DirectionItems.Where(i => i.Id == id).Include(i => i.DirectionItemsElements).FirstOrDefaultAsync(i => i.Id == id);
            if (result == null)
            {
                return NotFound("Direction item not found.");
            }
            var user = await _currentUser.GetCurrentUserAsync();
            var o = new AddDirectionItemsDto
            {

                Id = result.Id,
                Name = result.Name,
                Type = result.Type.ToString(),
                DirectionItemsElements = result.DirectionItemsElements.Where(func.GetFilter(Enum.Parse<RoleEnum>(user!.Role!))).Select(e => new DirectionItemsElementsDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Status = e.Status.ToString()
                }).ToList()

            };
            var c = new APIsGenralResponseDto<AddDirectionItemsDto>("Success", o);

            return Ok(c);
        }

        [Authorize(Policy = "Direction.Approve")]
        [HttpPost("Approve/{id}")]
        public async Task<ActionResult<APIsGenralResponseDto<AddDirectionItemsDto>>> Approve(int id)
        {
            var result = await _context.DirectionItems.Where(i=>i.Id==id).Include(i=>i.DirectionItemsElements).FirstOrDefaultAsync(i=>i.Id==id);
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null)
            {
                return NotFound("Direction item not found.");
            }
            result.Status = Utils.GetApprovalStatus(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));

           


            _context.DirectionItems.Update(result);
            await _context.SaveChangesAsync();

            return Ok(new APIsGenralResponseDto<string>("ok", null));
        }

        [Authorize(Policy = "Direction.Reject")]
        [HttpPost("Reject/{id}")]
        public async Task<ActionResult<APIsGenralResponseDto<AddDirectionItemsDto>>> Reject(int id, Comment comment)
        {
            var result = await _context.DirectionItems.Where(i => i.Id == id).Include(i => i.PlanDirection).FirstOrDefaultAsync(i => i.Id == id);
            var unit = await _context.Units.Where(i => i.Id == result.PlanDirection.UnitId).FirstOrDefaultAsync();
            var plan = await _context.Plans.Where(i => i.Id == result.PlanDirection.PlanId).FirstOrDefaultAsync(i => i.Id == result.PlanDirection.PlanId);
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null)
            {
                return NotFound("Direction item not found.");
            }
            result.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));
            result.Comment = comment.Comments;
            result.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));
            result.PlanDirection.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));
            _context.PlanDirection.Update(result.PlanDirection);

            _context.DirectionItems.Update(result);
            await _context.SaveChangesAsync();
            var actingRole = Enum.Parse<RoleEnum>(user.Role);
            await _notification.NotifyAsync(NotificationAction.Reject, ModulesNamesOnArabic.Direction, unit, FormNameToReturnToFront.directionstage, plan.Id, actingRole);

            return Ok(new APIsGenralResponseDto<string>("ok", null));
        }

        [Authorize(Policy = "Direction.Return")]
        [HttpPost("Return/{id}")]
        public async Task<ActionResult<APIsGenralResponseDto<AddDirectionItemsDto>>> Return(int id, Comment comment)
        {
            var result = await _context.DirectionItems.Where(i => i.Id == id).Include(i => i.PlanDirection).FirstOrDefaultAsync(i => i.Id == id);
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null)
            {
                return NotFound("Direction item not found.");
            }
            result.Status = Utils.GetApprovalStatus(ActionEnum.Return, Enum.Parse<RoleEnum>(user!.Role!));
            result.Comment = comment.Comments;
            result.PlanDirection.Status = Utils.GetApprovalStatus(ActionEnum.Return, Enum.Parse<RoleEnum>(user!.Role!));

            _context.DirectionItems.Update(result);
            _context.PlanDirection.Update(result.PlanDirection);
            await _context.SaveChangesAsync();
            var plan = await _context.Plans.Where(i => i.Id == result.PlanDirection.PlanId).FirstOrDefaultAsync(i => i.Id == result.PlanDirection.PlanId);

            // Notify the PLAN's unit (employee + unit manager), not the approver's unit.
            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == plan.UnitId)
                       ?? await _context.Units.FirstOrDefaultAsync(i => i.Id == user.UnitId);
            var actingRole = Enum.Parse<RoleEnum>(user.Role);
            await _notification.NotifyAsync(NotificationAction.Return, ModulesNamesOnArabic.Direction, unit, FormNameToReturnToFront.directionstage, plan.Id, actingRole);

            return Ok(new APIsGenralResponseDto<string>("ok", null));
        }
        //[HttpGet("GetAll/{PlanDirectionId}")]
        //public async Task<ActionResult<APIsGenralResponseDto<List<AddDirectionItemsDto>>>> GetAll(int PlanDirectionId)
        //{
        //    var result = _context.DirectionItems.AsQueryable();
        //    var GetAllDirectionDtoResponses = new GetAllDirectionDtoResponse
        //    {
        //        Value=result.Where(i=>i.Type == StrategicDirectionPointType.Value&&i.PlanDirectionId==PlanDirectionId).Select(i=>new GetAllDirectionDto
        //        {
        //            Id = i.Id,
        //            type = i.Type,
        //            status = i.Status

        //        }).ToList(),
        //        Vision = result.Where(i => i.Type == StrategicDirectionPointType.Vision && i.PlanDirectionId == PlanDirectionId).Select(i => new GetAllDirectionDto
        //        {
        //            Id = i.Id,
        //            type = i.Type,
        //            status = i.Status
        //        }).ToList(),
        //        Message = result.Where(i => i.Type == StrategicDirectionPointType.Message && i.PlanDirectionId == PlanDirectionId).Select(i => new GetAllDirectionDto
        //        {
        //            Id = i.Id,
        //            type = i.Type,
        //            status = i.Status
        //        }).ToList()

        //    };
        //    var c = new APIsGenralResponseDto<GetAllDirectionDtoResponse>("Success", GetAllDirectionDtoResponses);
        //    return Ok(c);

        //}
        [Authorize(Policy = "Direction.Update")]
        [HttpPost("Update")]
        public async Task<ActionResult<APIsGenralResponseDto<AddDirectionItemsDto>>> Update([FromBody] AddDirectionItemsDto element)
        {
            if (element == null )
            {
                return BadRequest("Invalid input.");
            }
            // Parse the string to the enum type  
            if (!Enum.TryParse<StrategicDirectionPointType>(element.Type, out var parsedType))
            {
                return BadRequest("Invalid type value.");
            }
            
            var Direction = await _context.DirectionItems.Where(i=>i.Id==element.Id).Include(i=>i.PlanDirection).Include(i=>i.DirectionItemsElements).FirstOrDefaultAsync(i=>i.Id==element.Id);
            Direction.Name = element.Name;
            Direction.Type = parsedType;
            Direction.DirectionItemsElements = element.DirectionItemsElements.Select(e => new DirectionItemsElements
            {
                Name = e.Name,
                Status = ApprovalStatus.Pending,
                Comment = null,

            }).ToList();
            if (Direction.Status == ApprovalStatus.ReturnedByHighManagement || Direction.Status == ApprovalStatus.ReturnedByRegionManager || Direction.Status == ApprovalStatus.ReturnedByUnitManager
                || Direction.Status == ApprovalStatus.RejectedByHighManagement || Direction.Status == ApprovalStatus.RejectedByRegionManager || Direction.Status == ApprovalStatus.RejectedByUnitManager)
            {
                Direction.Status = ApprovalStatus.Pending;
            }
            _unitOfWork.DirectionItems.Update(Direction);
            await _unitOfWork.SaveChangesAsync();
            return Ok(new APIsGenralResponseDto<string>("ok", null));

        }
        [Authorize(Policy = "Direction.Delete")]
        [HttpDelete("{id}")]
        public async Task<ActionResult<APIsGenralResponseDto<AddDirectionItemsDto>>> Delete(int id)
        {
            var result = await _context.DirectionItems.Where(i=>i.Id==id).Include(i=>i.DirectionItemsElements).FirstOrDefaultAsync(i=>i.Id==id);
            if (result == null)
            {
                return NotFound("Direction item not found.");
            }
            _context.DirectionItems.Remove(result);
            await _context.SaveChangesAsync();
            return Ok(new APIsGenralResponseDto<string>("ok", null));
        }
    }
}
