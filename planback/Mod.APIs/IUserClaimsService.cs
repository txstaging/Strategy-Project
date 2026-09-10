namespace Mod.APIs
{
    public interface IUserClaimsService
    {
        Task<Dictionary<string, List<string>>> CreateClaimsResponse(AppUser user);

    }
    public class UserClaimsService : IUserClaimsService
    {
        private readonly UserManager<AppUser> _userManager;

        public UserClaimsService(UserManager<AppUser> userManager)
        {
            _userManager = userManager;
        }

        public async Task<Dictionary<string, List<string>>> CreateClaimsResponse(AppUser user)
        {
            // HighManagement and Admin always get ALL permissions
            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault();
            if (userRole == "HighManagement" || userRole == "Admin")
            {
                return GetAllModulePermissions();
            }

            var claims = await _userManager.GetClaimsAsync(user) ?? new List<Claim>();
            var permissionList = GetConstants(typeof(AuthConstants.Modules));

            var claimsDictionary = new Dictionary<string, List<string>>();

            foreach (var claim in claims)
            {
                if (!permissionList.Contains(claim.Type)) continue;

                if (!claimsDictionary.TryGetValue(claim.Type, out var claimValues))
                {
                    claimValues = new List<string>();
                    claimsDictionary[claim.Type] = claimValues;
                }

                claimValues.Add(claim.Value);
            }

            return claimsDictionary;
        }

        private Dictionary<string, List<string>> GetAllModulePermissions()
        {
            var modules = GetConstants(typeof(AuthConstants.Modules));
            var permissions = GetConstants(typeof(AuthConstants.Permissions));

            var all = new Dictionary<string, List<string>>();
            foreach (var module in modules)
            {
                all[module] = new List<string>(permissions);
            }
            return all;
        }

        private List<string> GetConstants(Type type)
        {
            return type
                .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy)
                .Where(fi => fi.IsLiteral && !fi.IsInitOnly)
                .Select(x => x.GetRawConstantValue().ToString())
                .ToList();
        }
    }
}
