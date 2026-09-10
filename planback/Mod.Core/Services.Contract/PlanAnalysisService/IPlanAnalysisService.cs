namespace Mod.Core.Services.Contract.PlanAnalysisService
{
    public interface IPlanAnalysisService
    {
        Task<APIsResponseFilterDto<PlanAnalysisToReturnDto>> GetAll(string? Type, AppUser user, int Page = 1, int PerPage = 2);
        //Task<APIsResponseFilterDto<AddAnalysisPointsDto>> GetAllForUnit(int PlanId, int Page, int PerPage, string? Type);
        Task<APIsResponseFilterDto<PlanAnalysisToReturnDto>> GetAllForHighMangment(string? Type, int Page = 1, int PerPage = 2);
        Task<APIsResponseFilterDto<PlanAnalysisToReturnDto>> GetAllForHighMangment(int UnitId, string? CreatedDate = null, int Page = 1, int PerPage = 5);
        Task<APIsResponseFilterDto<PlanAnalysisToReturnDto>> GetAllForRegionManager(string? Type, AppUser user, int Page = 1, int PerPage = 2);
        Task<APIsGenralResponseDto<PlanAnalysisToReturnDto>> GetById(int id);
        Task<APIsGenralResponseDto<PlanAnalysisToReturnDto>> Approve(int PlanId, AppUser user);
        Task<APIsGenralResponseDto<PlanAnalysisToReturnDto>> ApproveByHighMangment(int PlanId);
        Task<APIsGenralResponseDto<PlanAnalysisToReturnDto>> ApproveByRegionManager(int PlanId);
        Task<APIsGenralResponseDto<PlanAnalysisToReturnDto>> ApproveByUnitManager(int PlanId, AppUser user);
    }
}
