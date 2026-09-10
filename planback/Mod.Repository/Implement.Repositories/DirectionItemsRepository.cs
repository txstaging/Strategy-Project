namespace Mod.Repository.Implement.Repositories
{
    public class DirectionItemsRepository : IDirectionItemsRepository
    {
        private readonly ModContext _context;

        public DirectionItemsRepository(ModContext context)
        {
            _context = context;
        }
        public async Task<DirectionItems> GetById(int id)
        {
            var item=await _context.DirectionItems.Where(i=>i.Id==id).Include(i=>i.DirectionItemsElements).FirstOrDefaultAsync();
            return item;
        }

        public async Task<DirectionItems> Update(DirectionItems directionItems)
        {
             _context.DirectionItems.Update(directionItems);
            return directionItems;
        }
    }
}
