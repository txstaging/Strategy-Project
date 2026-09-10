namespace Mod.Core.Services.Contract.AuthService
{
    public interface ICurrentUserService
    {
	    Task<AppUser?> GetCurrentUserAsync();
    }
}
