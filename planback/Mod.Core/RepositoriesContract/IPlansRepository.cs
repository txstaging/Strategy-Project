namespace Mod.Core.RepositoriesContract
{
    public interface IPlansRepository
    {
       
        Task <Plans> GetById(int id);
        Task <IEnumerable<Plans>> GetAll();
        void Update(Plans plan);
        Task<Plans> GetLastPlan(int UnitID);

    }
}
