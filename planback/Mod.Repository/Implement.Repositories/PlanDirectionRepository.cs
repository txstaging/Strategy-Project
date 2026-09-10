namespace Mod.Repository.Implement.Repositories
{
    public class PlanDirectionRepository : IPlanDirectionRepository
    {
        private readonly ModContext _context;

        public PlanDirectionRepository(ModContext context)
        {
            _context = context;
        }
        public async Task<PlanDirection> GetById(int PlanId)
        {
            var item = await _context.PlanDirection
                .Where(i => i.PlanId == PlanId)
                .Include(i => i.DirectionItems)
                .ThenInclude(i=>i.DirectionItemsElements)
                 
                .FirstOrDefaultAsync();

            return item;
        }

        public async Task<PlanDirection> Update(PlanDirection PlanDirectionItems)
        {
            _context.PlanDirection.Update(PlanDirectionItems);
            return PlanDirectionItems;
        }
    }
}
