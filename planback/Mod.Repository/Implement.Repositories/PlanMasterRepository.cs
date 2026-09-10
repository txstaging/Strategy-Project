namespace Mod.Repository.Implement.Repositories
{
    public class PlanMasterRepository : IPlanMasterRepository
    {
        private readonly ModContext _context;

        public PlanMasterRepository(ModContext context)
        {
            _context = context;
        }
        public async Task<PlanMaster> Add(PlanMaster plan)
        {
            _context.PlanMaster.Add(plan);
            return plan;
        }

        public Task<PlanMaster> Delete(int id)
        {
            throw new NotImplementedException();
        }

        public async Task<PlanMaster> GetLastMasterPlan()
        {
            var LastPlan=await _context.PlanMaster.OrderByDescending(x => x.Id).FirstOrDefaultAsync();
            return LastPlan;
        }

        public Task<AddPlansDto> Update(PlanMaster plan)
        {
            throw new NotImplementedException();
        }
    }
}
