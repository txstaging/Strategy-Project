namespace Mod.Service.Services.Implementation.CurrentUserService
{
    public class CurrentUserService(IHttpContextAccessor httpContextAccessor, ModContext context, UserManager<AppUser> userManager) : ICurrentUserService
	{
		private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
		private readonly ModContext _context = context;
		private readonly UserManager<AppUser> _userManager = userManager;

		public async Task<AppUser?> GetCurrentUserAsync()
		{
            var UserEmail = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value;

            if (string.IsNullOrEmpty(UserEmail)) return null;
            var user = await context.Users
        .Include(u => u.Units)
        // استبدل بـ العلاقات الفعلية

        .FirstOrDefaultAsync(u => u.Email == UserEmail);


            if (user == null) return null;
            var role = (await _userManager.GetRolesAsync(user!)).FirstOrDefault();
            if (role == null) return null;
            user.Role = role;

            return user;
        }
	}
}