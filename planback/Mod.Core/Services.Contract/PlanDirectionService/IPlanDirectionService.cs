namespace Mod.Core.Services.Contract.PlanDirectionService
{
    public interface IPlanDirectionService
    {
        Task<APIsGenralResponseDto<PlanDirectionDto>> Approve(int PlanId, AppUser user);
        Task<APIsGenralResponseDto<PlanDirectionDto>> ApproveByUnitManager(int PlanId);
        Task<APIsGenralResponseDto<PlanDirectionDto>> ApproveByRegionManager(int PlanId);
        Task<APIsGenralResponseDto<PlanDirectionDto>> ApproveByHighMangment(int PlanId);
        Task<APIsGenralResponseDto<PlanDirectionDto>> GetById(int PlanId);
    }
}
