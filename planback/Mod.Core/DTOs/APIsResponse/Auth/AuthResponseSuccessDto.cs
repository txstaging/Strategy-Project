namespace Mod.Core.DTOs.APIsResponse.Auth
{
    public class RegisterResponseSuccessDto<T>(T user)
	{
		public T User { get; set; } = user;
	}
}
