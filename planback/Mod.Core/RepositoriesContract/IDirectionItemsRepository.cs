namespace Mod.Core.RepositoriesContract
{
    public interface IDirectionItemsRepository
    {
        Task<DirectionItems>Update(DirectionItems directionItems);
        Task<DirectionItems> GetById(int id);

    }
}
