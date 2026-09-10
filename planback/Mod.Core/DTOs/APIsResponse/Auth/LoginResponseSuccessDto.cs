namespace Mod.Core.DTOs.APIsResponse.Auth
{
    public class LoginResponseSuccessDto<T>(string token)
	{
		public string Token { get; set; } = token;
        public int PlanId { get; set; }
        public Dictionary<string, List<string>> Permissions { get; set; }

    }
}
