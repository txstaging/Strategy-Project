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

        public DirectionItemsElementsController(IDirectionItemsElementsService service, ICurrentUserService currentUser,ModContext modContext)
        {
            _service = service;
          
            _currentUser = currentUser;
            _modContext = modContext;
        }

        [Authorize(Policy = "Direction.Approve")]
        [HttpPost("approve/{itemId}")]
        public async Task<ActionResult<APIsGenralResponseDto<DirectionItemsElements>>> Approve(   int itemId)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var result = await _modContext.DirectionItemsElements.Where(i => i.Id == itemId).Include(u => u.DirectionItems).FirstOrDefaultAsync(i => i.Id == itemId) ;
            
            
            result.Status = Utils.GetApprovalStatus(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));
            _modContext.DirectionItemsElements.Update(result);
            _modContext.SaveChanges();
            return Ok(new APIsGenralResponseDto<string>("ok",null));
        }

        [Authorize(Policy = "Direction.Reject")]
        [HttpPost("reject/{itemId}")]
        public async Task<ActionResult<APIsGenralResponseDto<DirectionItemsElements>>> Reject([FromBody] Comment  item,   int itemId)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var result = await _modContext.DirectionItemsElements.Where(i => i.Id == itemId).Include(u => u.DirectionItems).FirstOrDefaultAsync(i => i.Id == itemId);
            var itemm = await _modContext.DirectionItems.FindAsync(result.DirectionItemsId);
            itemm.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));
            itemm.Comment = item.Comments;
            //_modContext.DirectionItems.Update(itemm);
            result.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));
            result.Comment=item.Comments;
            _modContext.DirectionItemsElements.Update(result);
            _modContext.SaveChanges();

            return Ok(new APIsGenralResponseDto<string>("ok", null));
        }

        [Authorize(Policy = "Direction.Return")]
        [HttpPost("return/{itemId}")]
        public async Task<ActionResult<APIsGenralResponseDto<DirectionItemsElements>>> Return([FromBody] Comment item,  int PlanId,  int itemId)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var result = await _modContext.DirectionItemsElements.Where(i => i.Id == itemId).Include(u => u.DirectionItems).FirstOrDefaultAsync(i => i.Id == itemId);
            var itemm = await _modContext.DirectionItems.FindAsync(result.DirectionItemsId);
            itemm.Status = Utils.GetApprovalStatus(ActionEnum.Return, Enum.Parse<RoleEnum>(user!.Role!));
            itemm.Comment = item.Comments;
            _modContext.DirectionItems.Update(itemm);
            result.Status = Utils.GetApprovalStatus(ActionEnum.Return, Enum.Parse<RoleEnum>(user!.Role!));
            result.Comment = item.Comments;
            _modContext.DirectionItemsElements.Update(result);
            _modContext.SaveChanges();

            return Ok(new APIsGenralResponseDto<string>("ok", null));
        }
    }
}
