namespace Mod.Core.Services.Contract.PlansService
{
    public interface IMasterPlanService
    {
        Task<APIsGenralResponseDto<AddPlansDto>> Add(AddPlansDto plan);
        Task<APIsGenralResponseDto<Plans>> Delete(int id);
        Task<APIsGenralResponseDto<AddPlansDto>> Update(AddPlansDto plan);
    }
}
