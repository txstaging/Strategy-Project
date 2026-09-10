namespace Mod.Core.RepositoriesContract
{
    public interface IRoleAndPermissionsRepository
    {
        Task<List<UserRoleClaim>> GetUserPermission(int userId);
        Task<List<UserRoleClaim>> AssignUserPermissions(List<UserRoleClaim> permissions);
        Task<List<UserRoleClaim>> UpdateUserPermission(List<UserRoleClaim> permissions);
        Task<List<UserRoleClaim>> RemoveUserPermission(List<UserRoleClaim> permissions);
    }
}
