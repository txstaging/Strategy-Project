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

            // An item a manager sent back has to be edited before it can go up
            // again. Sending alone never cleared it, so the stage silently stayed
            // blocked with no explanation; now the refusal names what to fix.
            var blocking = a.Where(i => Utils.IsRejectedOrReturned(i.Status)).ToList();
            if (blocking.Count > 0)
            {
                var names = string.Join("، ", blocking.Select(i => i.Name).Where(n => !string.IsNullOrWhiteSpace(n)));
                var detail = string.IsNullOrWhiteSpace(names) ? "" : $" ({names})";
                return BadRequest(new
                {
                    message = $"يوجد {blocking.Count} عنصر تمت إعادته أو رفضه ويجب تعديله قبل الإرسال{detail}"
                });
            }

            // Notify the PLAN's unit, not the sender's, so the review reaches the
            // managers who own the plan.
            var plan = await _context.Plans.FirstOrDefaultAsync(p => p.Id == PlanId);
            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == plan!.UnitId)
                       ?? await _context.Units.FirstOrDefaultAsync(i => i.Id == currentUser.UnitId);

            var submittedAny = false;
            foreach (var i in a)
            {
                // Drafts only. This used to match Pending as well and then reset
                // every element underneath it, so each press of the send button
                // silently threw away the element approvals a manager had already
                // given.
                if (i.Status == ApprovalStatus.SavedAsDraft)
                {
                    i.Status = ApprovalStatus.Pending;
                    _context.DirectionItems.Update(i);
                    submittedAny = true;
                    foreach (var item in i.DirectionItemsElements)
                    {
                        if (item.Status == ApprovalStatus.SavedAsDraft)
                        {
                            item.Status = ApprovalStatus.Pending;
                            _context.DirectionItemsElements.Update(item);
                        }
                    }
                }
            }

            // New items join a stage that may already be further up the ladder;
            // they start with the unit manager, so the stage has to as well.
            if (submittedAny && plan?.PlanDirectionId != null)
            {
                ReopenStage(await _context.PlanDirection.FirstOrDefaultAsync(d => d.Id == plan.PlanDirectionId));
            }
            await _context.SaveChangesAsync();
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
            if (user == null || result == null)
            {
                return NotFound("Direction item not found.");
            }
            var actingRole = Enum.Parse<RoleEnum>(user!.Role!);

            // Respect the ladder. Without this the endpoint wrote the acting
            // role's status whatever rung the item was on, so approvals landed out
            // of order and the item and the stage drifted apart until no role's
            // send button matched any more.
            if (!Utils.CanRoleActOn(result.Status, actingRole))
            {
                return BadRequest(new { message = "لا يمكنك اتخاذ إجراء على هذا العنصر في حالته الحالية" });
            }

            result.Status = Utils.GetApprovalStatus(ActionEnum.Approve, actingRole);

            _context.DirectionItems.Update(result);
            await _context.SaveChangesAsync();

            // Approving used to notify nobody, so an employee heard back only
            // when their item was refused, never when it was accepted.
            var direction = await _context.PlanDirection.FirstOrDefaultAsync(i => i.Id == result.PlanDirectionId);
            var plan = direction == null ? null : await _context.Plans.FirstOrDefaultAsync(i => i.Id == direction.PlanId);
            if (plan != null)
            {
                var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == plan.UnitId)
                           ?? await _context.Units.FirstOrDefaultAsync(i => i.Id == user.UnitId);
                await _notification.NotifyAsync(NotificationAction.Approve, ModulesNamesOnArabic.Direction, unit, FormNameToReturnToFront.directionstage, plan.Id, actingRole);
            }

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
            if (Direction == null)
            {
                return NotFound(new APIsGenralResponseDto<string>("العنصر غير موجود", null));
            }

            // Track whether anything actually changed. A returned item only goes
            // back into review once the employee really edits it, so re-saving an
            // untouched form must not clear the return.
            var changed = Direction.Name != element.Name || Direction.Type != parsedType;

            Direction.Name = element.Name;
            Direction.Type = parsedType;

            // Match the incoming elements to the existing rows by id and update in
            // place. The previous version replaced the whole collection with new
            // rows, which severed the old ones (the foreign key is optional, so EF
            // orphaned rather than deleted them) and threw away every element-level
            // approval on the item. Five rows in the live database were orphaned
            // this way before the fix.
            var incoming = element.DirectionItemsElements ?? new List<DirectionItemsElementsDto>();
            var existing = Direction.DirectionItemsElements.ToList();

            // An element on an item that is still a draft stays a draft; it goes
            // up with the item when the employee sends. Marking it Pending here
            // put it in front of the managers, and in the stage-approval count,
            // before its item had even been submitted.
            var reopenAs = Direction.Status == ApprovalStatus.SavedAsDraft
                ? ApprovalStatus.SavedAsDraft
                : ApprovalStatus.Pending;

            // Whether anything here now has to be reviewed from the bottom again.
            var reopened = false;

            var keptIds = new HashSet<int>();
            foreach (var dto in incoming)
            {
                var match = dto.Id is > 0 ? existing.FirstOrDefault(x => x.Id == dto.Id) : null;

                if (match == null)
                {
                    // Genuinely new element.
                    Direction.DirectionItemsElements.Add(new DirectionItemsElements
                    {
                        Name = dto.Name,
                        Status = reopenAs,
                        Comment = null,
                    });
                    changed = true;
                    reopened = true;
                    continue;
                }

                keptIds.Add(match.Id);

                // Only an element whose text actually moved goes back to Pending;
                // one that was returned or rejected reopens as well. Everything
                // else keeps the approval it already earned.
                if (match.Name != dto.Name)
                {
                    match.Name = dto.Name;
                    match.Status = reopenAs;
                    match.Comment = null;
                    changed = true;
                    reopened = true;
                }
                else if (Utils.IsRejectedOrReturned(match.Status))
                {
                    match.Status = reopenAs;
                    match.Comment = null;
                    changed = true;
                    reopened = true;
                }

                _context.DirectionItemsElements.Update(match);
            }

            // Elements the employee removed from the form are deleted outright
            // rather than left behind with a null parent.
            var removed = existing.Where(x => !keptIds.Contains(x.Id)).ToList();
            if (removed.Count > 0)
            {
                _context.DirectionItemsElements.RemoveRange(removed);
                changed = true;
            }

            if (changed && Utils.IsRejectedOrReturned(Direction.Status))
            {
                Direction.Status = ApprovalStatus.Pending;
                Direction.Comment = null;
                reopened = true;
            }

            // Reset the stage as well. Every submit button on the Angular side reads
            // PlanDirection.Status, and if it stays where it was — returned, or
            // still with high management because only one element had been
            // refused — the unit manager is told the stage has already gone past
            // them and can never send the reworked item up. Goals has always done
            // this (GoalsController line 129). A finally approved stage is left
            // alone: the plan has already moved on to the objectives.
            if (reopened && reopenAs == ApprovalStatus.Pending)
            {
                ReopenStage(Direction.PlanDirection);
            }

            _unitOfWork.DirectionItems.Update(Direction);
            await _unitOfWork.SaveChangesAsync();
            return Ok(new APIsGenralResponseDto<string>("ok", null));

        }
        // Put the stage back with the unit manager because something in it has to
        // be reviewed from the bottom again. A finally approved stage is left
        // alone, since the plan has already moved on to the objectives.
        private void ReopenStage(PlanDirection? direction)
        {
            if (direction == null) return;
            if (direction.Status == ApprovalStatus.Pending || direction.Status == ApprovalStatus.ApprovedByHighManagement) return;

            direction.Status = ApprovalStatus.Pending;
            _context.PlanDirection.Update(direction);
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
            // Enforced server-side as well as in the UI, so it cannot be bypassed by
            // calling the API directly.
            if (!Utils.IsDeletable(result.Status))
            {
                return BadRequest(new { message = "لا يمكن حذف عنصر تمت الموافقة عليه" });
            }
            _context.DirectionItems.Remove(result);
            await _context.SaveChangesAsync();
            return Ok(new APIsGenralResponseDto<string>("ok", null));
        }
    }
}
