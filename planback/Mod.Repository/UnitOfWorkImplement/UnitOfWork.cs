namespace Mod.Repository.UnitOfWorkImplement
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ModContext _context;

        public IUnitRepository Unit { get; }

        public IPlansRepository Plans { get; }

        public IPlanAnalysisRepository PlanAnalysis {  get; }

        public IAnalysisPointsRepository AnalysisPoints {  get; }

        public IPlanMasterRepository PlanMaster {  get; }

        public IDirectionItemsElementsRepository DirectionItemsElements {  get; }

        public IDirectionItemsRepository DirectionItems { get; }

        public IPlanDirectionRepository PlanDirection { get; }

        public IRoleAndPermissionsRepository RoleAndPermissions { get; }

        //public IPlanGoalsRepository planGoals { get; }

        
        public UnitOfWork(ModContext context, IUnitRepository Unit, IPlansRepository Plans, IPlanAnalysisRepository PlanAnalysis, IAnalysisPointsRepository AnalysisPoints, IPlanMasterRepository PlanMaster, IDirectionItemsElementsRepository DirectionItemsElements, IDirectionItemsRepository DirectionItems, IPlanDirectionRepository PlanDirection/*, IPlanGoalsRepository planGoals*/,    IRoleAndPermissionsRepository roleAndPermissions)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            this.Unit = Unit;
            this.Plans = Plans;
            this.PlanAnalysis = PlanAnalysis;
            this.AnalysisPoints = AnalysisPoints;
            this.PlanMaster = PlanMaster;
            this.DirectionItemsElements = DirectionItemsElements;
            this.DirectionItems = DirectionItems;
            this.PlanDirection = PlanDirection;
            //this.planGoals = planGoals;
           
            RoleAndPermissions = roleAndPermissions;
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}
