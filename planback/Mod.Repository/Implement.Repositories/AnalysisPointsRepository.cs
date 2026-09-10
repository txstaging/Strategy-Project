namespace Mod.Repository.Implement.Repositories
{
    public class AnalysisPointsRepository : IAnalysisPointsRepository
    {
        private readonly ModContext _context;

        public AnalysisPointsRepository(ModContext context)
        {
            _context = context;
        }
        public async Task<AnalysisPoints> Add(AnalysisPoints point)
        {
            var result = await _context.AnalysisPoints.AddAsync(point);

            return result.Entity;

        }

        public async Task<AnalysisPoints> Delete(int id)
        {
            var result = await _context.AnalysisPoints.FindAsync(id);
            _context.AnalysisPoints.Remove(result);
            return result;
        }

        public IQueryable<AnalysisPoints> GetAcceptablePoint(Expression<Func<AnalysisPoints, bool>>? predicate = null)
        {
            return predicate == null ? _context.AnalysisPoints.AsQueryable() : _context.AnalysisPoints.Where(predicate).Include(i => i.Plans);
        }

        public async Task<IEnumerable<AnalysisPoints>> GetAll()
        {
            return await _context.AnalysisPoints.Include(i=>i.PlanAnalysis).OrderBy(p => p.Id).ToListAsync();
        }

        public async Task<AnalysisPoints> GetById(int id)
        {
            return await _context.AnalysisPoints.Where(i => i.Id == id).Include(i => i.Plans).FirstOrDefaultAsync();
        }

        public async Task<AnalysisPoints> Update(AnalysisPoints point)
        {
            _context.AnalysisPoints.Update(point);

            return point;
        }
    }
}
