namespace Mod.Core.RepositoriesContract
{
    public interface IDirectionItemsElementsRepository
    {
        Task<DirectionItemsElements> Update(DirectionItemsElements itemsElements);
        Task<DirectionItemsElements> Delete(int ElementId);
        Task<DirectionItemsElements?> GetById(int ElementId);
    }
}
