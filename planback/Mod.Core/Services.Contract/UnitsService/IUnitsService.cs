namespace Mod.Core.Services.Contract.UnitsService
{
    public interface IUnitsService
    {
        Task<APIsGenralResponseDto<string>> Add(string UnitName);
        Task<Units> GetById(int id);
        Task<APIsGenralResponseDto<GetAllUnitDto>> GetAll();
    }
}
