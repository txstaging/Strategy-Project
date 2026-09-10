namespace Mod.Core.Services.Contract.DirectionItemsElementsService
{
    public interface IDirectionItemsElementsService
    {
        Task<APIsGenralResponseDto<DirectionItemsElements>> Approve(int PlanId, int ItemID, AppUser user);
        Task<APIsGenralResponseDto<DirectionItemsElements>> ApproveByHighMangment(int PlanId, int ItemID);
        Task<APIsGenralResponseDto<DirectionItemsElements>> ApproveByRegionManager(int PlanId, int ItemID);
        Task<APIsGenralResponseDto<DirectionItemsElements>> Reject(ReturnDirectionItemDto item, int PlanId, int ItemID, AppUser user);
        Task<APIsGenralResponseDto<DirectionItemsElements>> RejectByHighMangment(int PlanId, int ItemID, ReturnDirectionItemDto item);
        Task<APIsGenralResponseDto<DirectionItemsElements>> RejectByRegionManager(int PlanId, int ItemID, ReturnDirectionItemDto item);
        Task<APIsGenralResponseDto<DirectionItemsElements>> Return(int PlanId, int ItemID, AppUser user, ReturnDirectionItemDto item);
        Task<APIsGenralResponseDto<DirectionItemsElements>> ReturnByHighMangment(int PlanId, int ItemID, ReturnDirectionItemDto item);
        Task<APIsGenralResponseDto<DirectionItemsElements>> ReturnByRegionManager(int PlanId, int ItemID, ReturnDirectionItemDto item);
    }
}
