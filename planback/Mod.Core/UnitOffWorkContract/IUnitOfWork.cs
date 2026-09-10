using Mod.Core.RepositoriesContract;

namespace Mod.Core.UnitOffWorkContract
{
    public interface IUnitOfWork : IDisposable
    {
        IUnitRepository Unit {  get; }
        IPlansRepository Plans { get; }
        IPlanAnalysisRepository PlanAnalysis { get; }
        IAnalysisPointsRepository AnalysisPoints { get; }
        IPlanMasterRepository PlanMaster { get; }
        IDirectionItemsElementsRepository DirectionItemsElements {  get; }
        IDirectionItemsRepository DirectionItems { get; }
        IPlanDirectionRepository PlanDirection { get; }
        //IPlanGoalsRepository planGoals { get; }
       
        
       
        IRoleAndPermissionsRepository RoleAndPermissions { get; }
        Task<int> SaveChangesAsync();
    }
}
