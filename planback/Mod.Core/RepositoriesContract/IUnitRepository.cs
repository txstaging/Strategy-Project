namespace Mod.Core.RepositoriesContract
{
    public interface IUnitRepository
    {
        Task Add(Units unit);
        Task<Units> GetById(int id);
        Task<IEnumerable<Units>> GetAll();
        Task<IEnumerable<Units>> GetUserUnits(AppUser user);
    }
}
