namespace Mod.Repository.Implement.Repositories
{
    public class PlanAnalysisRepository : IPlanAnalysisRepository
    {
        private readonly ModContext _context;

        public PlanAnalysisRepository(ModContext context)
        {
            _context = context;
        }
        public async Task<IEnumerable<PlanAnalysis>> GetAll()
        {
            var result = await _context.PlanAnalysis
                .Include(i => i.Plan)
                .ThenInclude(i => i.PlanMaster).Include(i=>i.Units).Include(i=>i.User).Include(i=>i.AnalysisPoints)
                .ToListAsync();

            return result;
        }

        public async Task<IEnumerable<PlanAnalysis>> GetAllByManger(string Role ,int UnitId, string? ApprovedDate = null)
        {
            var query = _context.PlanAnalysis.AsQueryable(); // Start with an IQueryable

            // Parse ApprovedDate only once and handle potential parsing errors
            DateTime? parsedDate = null;

            if (int.TryParse(ApprovedDate, out int year))
            {
                parsedDate = new DateTime(year, 1, 1); // Default to Jan 1st of the given year
            }


            // Use a switch statement for cleaner role handling
            switch (Role)
            {
                case nameof(RoleEnum.HighManagement):
                    query = query.Where(i => i.Status == ApprovalStatus.ApprovedByRegionManager);
                    break;
                case nameof(RoleEnum.RegionManager):
                    query = query.Where(i => i.Status == ApprovalStatus.ApprovedByUnitManager);
                    break;
                default:
                    return new List<PlanAnalysis>(); // Return empty list for unknown roles
            }

            // Apply UnitId filter if provided
            if (UnitId != 0)
                query = query.Where(i => i.UnitId == UnitId);
            

            // Apply Date filter if provided and parsing was successful
            if (parsedDate.HasValue)
                query = query.Where(i => i.DateOfApproval.HasValue && i.DateOfApproval.Value.Year == parsedDate.Value.Year);
            


            return await query.ToListAsync(); // Execute the query only once at the end
        }

        public async Task<PlanAnalysis> GetById(int id)
        {
            return await _context.PlanAnalysis.Where(i=>i.PlanId==id).Include(i=>i.AnalysisPoints).Include(i=>i.Units).Include(i=>i.User).FirstOrDefaultAsync();
        }

        public async Task<PlanAnalysis> GetByPlanId(int id)
        {
            
            var a=await _context.PlanAnalysis.Where(p=>p.PlanId == id).Include(i => i.AnalysisPoints).Include(i => i.Units).Include(i => i.User).FirstOrDefaultAsync();
            return a;
        }

        public async Task Update(PlanAnalysis Analysis)
        {
             _context.PlanAnalysis.Update(Analysis);
        }
    }
}
