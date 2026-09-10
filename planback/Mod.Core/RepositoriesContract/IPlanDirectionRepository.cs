namespace Mod.Core.RepositoriesContract
{
    public interface IPlanDirectionRepository
    {
        Task<PlanDirection> Update(PlanDirection PlanDirectionItems);
        Task<PlanDirection> GetById(int PlanId);
    }
}
