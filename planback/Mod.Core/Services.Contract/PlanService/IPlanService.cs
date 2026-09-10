namespace Mod.Core.Services.Contract.PlanService
{
    public interface IPlanService
    {
        Task<APIsGenralResponseDto<GetAllPlanDto>> GetById(int id);
        Task<APIsResponseFilterDto<GetAllPlanDto>> GetAll(string? Filter, int? Unit, int? Year, int Page, int PerPage);
    }
}
