namespace Mod.Core.Services.Contract.AnalysisPointsService
{
    public interface IAnalysisPointsService
    {
        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> Add(AddAnalysisPointsDto point, AppUser user, int PlanID);
        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> AddByUnitEmployee(AddAnalysisPointsDto point, int PlanID);
        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> AddByHighMangment(AddAnalysisPointsDto point, int PlanID);
        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> AddByRegionManager(AddAnalysisPointsDto point, int PlanID);
        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> GetById(int id);
        Task<APIsResponseFilterDto<AddAnalysisPointsDto>> GetAll(int PlanId, int Page, int PerPage, string? Type, AppUser user);
        Task<APIsResponseFilterDto<AddAnalysisPointsDto>> GetAllForUnit(int PlanId, int Page, int PerPage, string? Type);
        Task<APIsResponseFilterDto<AddAnalysisPointsDto>> GetAllForHighMangment(int PlanId, int Page, int PerPage, string? Type);
        Task<APIsResponseFilterDto<AddAnalysisPointsDto>> GetAllForRegionManager(int PlanId, int Page, int PerPage, string? Type);
        Task<GetAllPoints> GetAllV2(int PlanId, AppUser user);
        Task<GetAllPoints> GetAllForUnitV2(int PlanId);
        Task<GetAllPoints> GetAllForHighMangmentV2(int PlanId);
        Task<GetAllPoints> GetAllForRegionManagerV2(int PlanId);

        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> Delete(int id, int PlanID);
        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> Update(AddAnalysisPointsDto point, int PlanId, int Id);
        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> Approve(int PlanId, int PointId, AppUser user);
        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> ApproveByHighMangment(int PlanId, int PointId);
        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> ApproveByRegionManager(int PlanId, int PointId);
        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> Reject(int PlanId, int PointId, ReturnAnalysisPointToEmployee Comment, AppUser user);
        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> RejectByHighMangment(int PlanId, int PointId, ReturnAnalysisPointToEmployee Comment);
        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> RejectByRegionManager(int PlanId, int PointId, ReturnAnalysisPointToEmployee Comment);
        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> ReturnToEdit(int PlanId, AppUser user, int PointId, ReturnAnalysisPointToEmployee Comment);
        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> ReturnToEditByHighMangment(int PlanId, int PointId, ReturnAnalysisPointToEmployee Comment);
        Task<APIsGenralResponseDto<AddAnalysisPointsDto>> ReturnToEditByRegionManager(int PlanId, int PointId, ReturnAnalysisPointToEmployee Comment);

    }
}
