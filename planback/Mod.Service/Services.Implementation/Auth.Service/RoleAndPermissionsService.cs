namespace Mod.Service.Services.Implementation.Auth.Service
{
    public class RoleAndPermissionsService : IRoleAndPermissionsService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<AppUser> _userManager;

        public RoleAndPermissionsService(IUnitOfWork unitOfWork, UserManager<AppUser> userManager)
        {
            _unitOfWork = unitOfWork;
            _userManager = userManager;   
        }
        public async Task<List<UserRoleClaim>> AssignUserPermissions(List<UserRoleClaim> permissions)
        {
            return await _unitOfWork.RoleAndPermissions.AssignUserPermissions(permissions);
        }

        public async Task<List<UserRoleClaim>> GetUserPermission(int userId)
        {
           return await _unitOfWork.RoleAndPermissions.GetUserPermission(userId);
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
