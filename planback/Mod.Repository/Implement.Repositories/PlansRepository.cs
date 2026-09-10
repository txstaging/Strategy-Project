namespace Mod.Repository.Implement.Repositories
{
    public class PlansRepository : IPlansRepository
    {
        private readonly ModContext _context;
        

        public PlansRepository(ModContext context)
        {
            _context = context;
            
        }

        public async Task<IEnumerable<Plans>> GetAll()
        {
            return await _context.Plans.Include(i=>i.Units).Include(i=>i.PlanMaster).Include(i=>i.PlanAnalysis).Include(i=>i.PlanDirection).ToListAsync();
        }

        public async Task<Plans> GetById(int id)
        {
            return await _context.Plans.Where(i=>i.Id==id)
				.Include(i=>i.Units)
				.Include(i=>i.PlanInitiativeStep)
				.Include(i=>i.PlanAnalysis)
				.Include(i=>i.PlanDirection)
				.Include(i=>i.PlanGoalsStep)
				//.ThenInclude(i=>i.Name)
				//.Include(i=>i.PlanGoals).ThenInclude(i=>i.Indicator)
				//.Include(i=>i.PlanGoals).ThenInclude(i=>i.Descripition)
               
                
				.FirstOrDefaultAsync();
        }

        public async Task<Plans> GetLastPlan(int UnitID)
        {
            var LastPlan = await _context.Plans.Where(i=>i.UnitId==UnitID).OrderByDescending(x => x.Id).FirstOrDefaultAsync(i=>i.UnitId==UnitID);
            return LastPlan;
        }

        public void Update(Plans plan)
        {
            _context.Plans.Update(plan);
        }
    }
}
