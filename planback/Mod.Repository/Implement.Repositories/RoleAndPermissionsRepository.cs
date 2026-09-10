namespace Mod.Repository.Implement.Repositories
{
    public class RoleAndPermissionsRepository : IRoleAndPermissionsRepository
    {
        private readonly ModContext _context;

        public RoleAndPermissionsRepository(ModContext context)
        {
            _context = context;
        }

        public async Task<List<UserRoleClaim>> AssignUserPermissions(List<UserRoleClaim> permissions)
        {
            try
            {
               // await _context.UserPermissions.AddRangeAsync(permissions);

                return permissions;
            }
            catch (Exception ex)
            {
            }
            return null;
        }

        public async Task<List<UserRoleClaim>> GetUserPermission(int userId)
        {
            return new List<UserRoleClaim>(); //await _context.UserPermissions.Where(up => up.UserId == userId).ToListAsync();
        }

        public Task<List<UserRoleClaim>> RemoveUserPermission(List<UserRoleClaim> permissions)
        {
            throw new NotImplementedException();
        }

        public Task<List<UserRoleClaim>> UpdateUserPermission(List<UserRoleClaim> permissions)
        {
            throw new NotImplementedException();
        }
    }
}
