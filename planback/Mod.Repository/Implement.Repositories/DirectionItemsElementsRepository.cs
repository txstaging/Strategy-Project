namespace Mod.Repository.Implement.Repositories
{
    public class DirectionItemsElementsRepository : IDirectionItemsElementsRepository
    {
        private readonly ModContext _context;

        public DirectionItemsElementsRepository(ModContext context)
        {
            _context = context?? throw new ArgumentNullException(nameof(context));
        }
        public async Task<DirectionItemsElements> Delete(int ElementId)
        {
            var obj=await _context.DirectionItemsElements.FindAsync(ElementId);
             _context.DirectionItemsElements.Remove(obj);
            return obj;
        }

        public async Task<DirectionItemsElements> GetById(int ElementId)
        {
            var obj = await _context.DirectionItemsElements.FindAsync(ElementId);
            return obj;
        }

        public async Task<DirectionItemsElements?> Update(DirectionItemsElements itemsElements)
        {
            var obj =  _context.DirectionItemsElements.FindAsync(itemsElements.Id);
             _context.DirectionItemsElements.Update(itemsElements);
            return await obj.ConfigureAwait(false);
        }
    }
}
