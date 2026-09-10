namespace Mod.Service.Services.Implementation.Auth.Service
{
    public class AuthService : IAuthService
	{
		private readonly IConfiguration _configuration;

		public AuthService(IConfiguration configuration)
		{
			_configuration = configuration;
		}
		public async Task<string> CreateToken(AppUser user, UserManager<AppUser> userManager)
		{
			var claims = new List<Claim>
			{
				new(ClaimTypes.NameIdentifier, user.Id.ToString()),
				new(ClaimTypes.Email, user.Email!),
                new Claim("unitId", user.UnitId.ToString()),
                new(ClaimTypes.Role, user.Role!),

            };

			var userClaims = await userManager.GetClaimsAsync(user);
			claims.AddRange(userClaims);
            var AuthKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));

			var Token = new JwtSecurityToken(
				issuer: _configuration["Jwt:Issuer"],
				audience: _configuration["Jwt:Audience"],
				expires: DateTime.Now.AddDays(double.Parse(_configuration["Jwt:days"])),
				claims: claims,
				signingCredentials: new SigningCredentials(AuthKey, SecurityAlgorithms.HmacSha256)
				);
			return await Task.FromResult(new JwtSecurityTokenHandler().WriteToken(Token));
		}
    }
}

