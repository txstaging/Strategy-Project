using System.Drawing;

namespace Mod.Service.Services.Implementation.DirectionItemsElementsService
{
    public class DirectionItemsElementsService : IDirectionItemsElementsService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly UserManager<AppUser> _userManager;

        public DirectionItemsElementsService(IUnitOfWork unitOfWork, IMapper mapper, UserManager<AppUser> userManager)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _userManager = userManager;
        }
        public async Task<APIsGenralResponseDto<DirectionItemsElements>> Approve(int PlanId, int ItemID, AppUser user)
        {
            var userRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
            var obj = await _unitOfWork.DirectionItemsElements.GetById(ItemID);
            obj.Status = Utils.GetApprovalStatus(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));
            _unitOfWork.DirectionItemsElements.Update(obj);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<DirectionItemsElements>("Updated Succses", obj);

        }

        public async Task<APIsGenralResponseDto<DirectionItemsElements>> ApproveByHighMangment(int PlanId, int ItemID)
        {
            var obj = await _unitOfWork.DirectionItemsElements.GetById(ItemID);
            obj.Status = ApprovalStatus.ApprovedByHighManagement;
            await _unitOfWork.DirectionItemsElements.Update(obj);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<DirectionItemsElements>("Updated Succses", obj);
        }

        public async Task<APIsGenralResponseDto<DirectionItemsElements>> ApproveByRegionManager(int PlanId, int ItemID)
        {
            var obj = await _unitOfWork.DirectionItemsElements.GetById(ItemID);
            obj.Status = ApprovalStatus.ApprovedByRegionManager;
            await _unitOfWork.DirectionItemsElements.Update(obj);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<DirectionItemsElements>("Updated Succses", obj);
        }

        public async Task<APIsGenralResponseDto<DirectionItemsElements>> Reject(ReturnDirectionItemDto item, int PlanId, int ItemID, AppUser user)
        {
            var userRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
            var obj = await _unitOfWork.DirectionItemsElements.GetById(ItemID);
            obj.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));
            obj.Comment = item.Comment;
            _unitOfWork.DirectionItemsElements.Update(obj);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<DirectionItemsElements>("Updated Succses", obj);
        }

        public async Task<APIsGenralResponseDto<DirectionItemsElements>> RejectByHighMangment(int PlanId, int ItemID, ReturnDirectionItemDto item)
        {
            var obj = await _unitOfWork.DirectionItemsElements.GetById(ItemID);
            obj.Status = ApprovalStatus.RejectedByHighManagement;
            obj.Comment = item.Comment;
            await _unitOfWork.DirectionItemsElements.Update(obj);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<DirectionItemsElements>("Updated Succses", obj);
        }

        public async Task<APIsGenralResponseDto<DirectionItemsElements>> RejectByRegionManager(int PlanId, int ItemID, ReturnDirectionItemDto item)
        {

            var obj = await _unitOfWork.DirectionItemsElements.GetById(ItemID);
            obj.Status = ApprovalStatus.RejectedByRegionManager;
            obj.Comment = item.Comment;
            await _unitOfWork.DirectionItemsElements.Update(obj);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<DirectionItemsElements>("Updated Succses", obj);
        }

        public async Task<APIsGenralResponseDto<DirectionItemsElements>> Return(int PlanId, int ItemID, AppUser user, ReturnDirectionItemDto item)
        {
            var userRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
            var obj = await _unitOfWork.DirectionItemsElements.GetById(ItemID);

            obj.Status = Utils.GetApprovalStatus(ActionEnum.Return, Enum.Parse<RoleEnum>(user!.Role!));
            obj.Comment = item.Comment;
            _unitOfWork.DirectionItemsElements.Update(obj);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<DirectionItemsElements>("Updated Succses", obj);
        }

        public async Task<APIsGenralResponseDto<DirectionItemsElements>> ReturnByHighMangment(int PlanId, int ItemID, ReturnDirectionItemDto item)
        {
            var obj = await _unitOfWork.DirectionItemsElements.GetById(ItemID);
            obj.Status = ApprovalStatus.ReturnedByHighManagement;
            obj.Comment = item.Comment;
            await _unitOfWork.DirectionItemsElements.Update(obj);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<DirectionItemsElements>("Updated Succses", obj);
        }

        public async Task<APIsGenralResponseDto<DirectionItemsElements>> ReturnByRegionManager(int PlanId, int ItemID, ReturnDirectionItemDto item)
        {
            var obj = await _unitOfWork.DirectionItemsElements.GetById(ItemID);
            obj.Status = ApprovalStatus.ReturnedByRegionManager;
            obj.Comment = item.Comment;
            await _unitOfWork.DirectionItemsElements.Update(obj);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<DirectionItemsElements>("Updated Succses", obj);
        }
    }
}
