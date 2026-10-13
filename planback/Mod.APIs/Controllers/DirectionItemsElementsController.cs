using Mod.Core.Utils;



namespace Mod.APIs.Controllers
{
    [Route("/api/Plans/{PlanId}/Direction/element")]
    [ApiController]
    [Authorize]
    public class DirectionItemsElementsController : BaseController
    {
        private readonly IDirectionItemsElementsService _service;
        private readonly ICurrentUserService _currentUser;
        private readonly ModContext _modContext;
        private readonly INotificationService _notification;

        public DirectionItemsElementsController(IDirectionItemsElementsService service, ICurrentUserService currentUser, ModContext modContext, INotificationService notificationService)
        {
            _service = service;

            _currentUser = currentUser;
            _modContext = modContext;
            _notification = notificationService;
        }

        [Authorize(Policy = "Direction.Approve")]
        [HttpPost("approve/{itemId}")]
        public async Task<ActionResult<APIsGenralResponseDto<DirectionItemsElements>>> Approve(   int itemId)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var result = await LoadElement(itemId);
            if (result == null) return NotFound(new APIsGenralResponseDto<string>("Element not found", null));

            var actingRole = Enum.Parse<RoleEnum>(user!.Role!);

            // Same ladder rule as the item-level approve: a role may only act once
            // the level below has pressed send, not the moment a single item was
            // ticked.
            if (!Utils.CanRoleActOn(result.Status, actingRole))
            {
                return BadRequest(new APIsGenralResponseDto<string>("لا يمكنك اتخاذ إجراء على هذا العنصر في حالته الحالية", null));
            }

            result.Status = Utils.GetApprovalStatus(ActionEnum.Approve, actingRole);
            _modContext.DirectionItemsElements.Update(result);
            await _modContext.SaveChangesAsync();

            var action = actingRole == RoleEnum.HighManagement
                ? NotificationAction.FinalApprove
                : NotificationAction.Approve;
            await NotifyOnElement(result, action, user, actingRole);

            return Ok(new APIsGenralResponseDto<string>("ok",null));
        }

        [Authorize(Policy = "Direction.Reject")]
        [HttpPost("reject/{itemId}")]
        public async Task<ActionResult<APIsGenralResponseDto<DirectionItemsElements>>> Reject([FromBody] Comment  item,   int itemId)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var result = await LoadElement(itemId);
            if (result == null) return NotFound(new APIsGenralResponseDto<string>("Element not found", null));

            var actingRole = Enum.Parse<RoleEnum>(user!.Role!);
            var itemm = await _modContext.DirectionItems.FindAsync(result.DirectionItemsId);
            itemm.Status = Utils.GetApprovalStatus(ActionEnum.Reject, actingRole);
            itemm.Comment = item.Comments;
            _modContext.DirectionItems.Update(itemm);
            result.Status = Utils.GetApprovalStatus(ActionEnum.Reject, actingRole);
            result.Comment=item.Comments;
            _modContext.DirectionItemsElements.Update(result);
            SendStageBack(result, ActionEnum.Reject, actingRole);
            await _modContext.SaveChangesAsync();

            await NotifyOnElement(result, NotificationAction.Reject, user, actingRole);

            return Ok(new APIsGenralResponseDto<string>("ok", null));
        }

        [Authorize(Policy = "Direction.Return")]
        [HttpPost("return/{itemId}")]
        public async Task<ActionResult<APIsGenralResponseDto<DirectionItemsElements>>> Return([FromBody] Comment item,  int PlanId,  int itemId)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var result = await LoadElement(itemId);
            if (result == null) return NotFound(new APIsGenralResponseDto<string>("Element not found", null));

            var actingRole = Enum.Parse<RoleEnum>(user!.Role!);
            var itemm = await _modContext.DirectionItems.FindAsync(result.DirectionItemsId);
            itemm.Status = Utils.GetApprovalStatus(ActionEnum.Return, actingRole);
            itemm.Comment = item.Comments;
            _modContext.DirectionItems.Update(itemm);
            result.Status = Utils.GetApprovalStatus(ActionEnum.Return, actingRole);
            result.Comment = item.Comments;
            _modContext.DirectionItemsElements.Update(result);
            SendStageBack(result, ActionEnum.Return, actingRole);
            await _modContext.SaveChangesAsync();

            await NotifyOnElement(result, NotificationAction.Return, user, actingRole);

            return Ok(new APIsGenralResponseDto<string>("ok", null));
        }

        // Refusing one element sends the whole stage back, as refusing an item
        // already did. The stage used to stay where it was — with high
        // management, say — while the element started again at the bottom, so
        // once the employee had fixed it the unit manager was told the stage had
        // already gone past them and the send button never came back for anyone.
        // Editing the element resets the stage to Pending (DirectionItems Update),
        // and from there it climbs the ladder again.
        private void SendStageBack(DirectionItemsElements element, ActionEnum action, RoleEnum actingRole)
        {
            var direction = element.DirectionItems?.PlanDirection;
            if (direction == null) return;

            direction.Status = Utils.GetApprovalStatus(action, actingRole);
            _modContext.PlanDirection.Update(direction);
        }

        // PlanDirection is pulled in as well as DirectionItems because the
        // notification has to be addressed to the plan's unit, and the plan is
        // only reachable through it.
        private Task<DirectionItemsElements?> LoadElement(int itemId) =>
            _modContext.DirectionItemsElements
                .Include(u => u.DirectionItems)
                .ThenInclude(i => i.PlanDirection)
                .FirstOrDefaultAsync(i => i.Id == itemId);

        // Approving, rejecting or returning a vision, message or value element
        // used to notify nobody at all: this controller had no notification
        // service, so the employee was never told their element was refused.
        private async Task NotifyOnElement(DirectionItemsElements element, NotificationAction action, AppUser user, RoleEnum actingRole)
        {
            var planId = element.DirectionItems?.PlanDirection?.PlanId;
            if (planId == null) return;

            var plan = await _modContext.Plans.FirstOrDefaultAsync(i => i.Id == planId);
            if (plan == null) return;

            // Address the PLAN's unit, not the approver's, so region and high
            // management actions still reach the employees who own the work.
            var unit = await _modContext.Units.FirstOrDefaultAsync(i => i.Id == plan.UnitId)
                       ?? await _modContext.Units.FirstOrDefaultAsync(i => i.Id == user.UnitId);

            await _notification.NotifyAsync(action, ModulesNamesOnArabic.Direction, unit, FormNameToReturnToFront.directionstage, plan.Id, actingRole);
        }
    }
}
