namespace Mod.Core.RepositoriesContract
{
    public interface IPlanAnalysisRepository
    {
        Task <PlanAnalysis> GetById(int id);
        Task <IEnumerable<PlanAnalysis>> GetAll();
        Task <IEnumerable<PlanAnalysis>> GetAllByManger(string Roll,int UnitId, string? CreatedAt = null);
        Task Update(PlanAnalysis Analysis);
        Task<PlanAnalysis> GetByPlanId(int id);

    }
}
