namespace Mod.Core.RepositoriesContract
{
    public interface IPlanMasterRepository
    {
        Task<PlanMaster> Add(PlanMaster plan);
        Task<PlanMaster> Delete(int id);
        Task<AddPlansDto> Update(PlanMaster plan);
        Task<PlanMaster> GetLastMasterPlan();
    }
}
