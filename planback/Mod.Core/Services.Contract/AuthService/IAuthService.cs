namespace Mod.Core.Services.Contract.AuthService
{
    public interface IAuthService
    {
        Task<string> CreateToken(AppUser user,UserManager<AppUser>UserManager);
    }
}
