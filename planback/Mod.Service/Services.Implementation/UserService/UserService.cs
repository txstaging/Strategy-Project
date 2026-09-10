namespace Mod.Service.Services.Implementation.UserService
{
    public class UserService : IUserService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<UserRole> _roleManager;
        
        private readonly IAuthService _authService;
        private readonly IMapper _mapper;

        public UserService(UserManager<AppUser> userManager, RoleManager<UserRole> roleManager, IAuthService authService,IMapper mapper)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _authService = authService;
            _mapper = mapper;
        }

        public async Task<APIsGenralResponseDto<CreateUserDto>> CreateUser(CreateUserDto model)
        {
            var RoleName = ReturnRoleName(model.UserRole);
            if (string.IsNullOrEmpty(RoleName))
            {
                return new APIsGenralResponseDto<CreateUserDto>("Role does not exist", model);
            }

            model.UserRole = RoleName;
            var registerModel = _mapper.Map<RegisterDto>(model);

            var registerResponse = await RegisterAsync(registerModel);

            // Handle failure case
            if (registerResponse is AuthResponseFailDto<IEnumerable<string>> failResponse)
            {
                return new APIsGenralResponseDto<CreateUserDto>(
                    "User registration failed",
                    
                    null// Return error messages
                );
            }

            return new APIsGenralResponseDto<CreateUserDto>("Success", model);
        }


        public async Task<object> RegisterAsync(RegisterDto model)
        {
            if (model == null)
            {
                return new AuthResponseFailDto<IEnumerable<string>>(
                    "Invalid request",
                    new List<string> { "Invalid registration data" }
                );
            }

            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
            {
                return new AuthResponseFailDto<IEnumerable<string>>(
                    "User creation failed",
                    new List<string> { "A user with this email already exists." }
                );
            }

            // 🔹 توليد اسم مستخدم عشوائي
            string newUserName = GenerateRandomUsername();

            var user = new AppUser
            {
                DisplayName = model.UserName, // الاسم العربي يبقى في DisplayName فقط
                Email = model.Email,
                Phone = model.PhoneNumber,
                UnitId = model.UnitId,
                UserName = newUserName,
                Number=model.PhoneNumber.ToString()// اسم مستخدم عشوائي
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
            {
                return new AuthResponseFailDto<IEnumerable<string>>(
                    "User creation failed",
                    result.Errors.Select(e => e.Description)
                );
            }

            if (!string.IsNullOrEmpty(model.Role))
            {
                var roleExists = await _roleManager.RoleExistsAsync(model.Role);
                if (!roleExists)
                {
                    return new AuthResponseFailDto<IEnumerable<string>>(
                        "Role does not exist",
                        new List<string> { "The specified role does not exist" }
                    );
                }

                await _userManager.AddToRoleAsync(user, model.Role);
            }

            var token = await _authService.CreateToken(user, _userManager);

            return new RegisterResponseSuccessDto<UserDto>(
                new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    Name = user.DisplayName, // الاسم العربي يبقى كما هو
                    Role = model.Role,
                }
            );
        }

        public string ReturnRoleName(string RoleDto)
        {
            if(RoleDto == "موظف وحدة")return  RoleEnum.UnitEmployee.ToString();
            if (RoleDto == "مدير وحدة") return RoleEnum.UnitManager.ToString();
            if (RoleDto == "مدير عام") return RoleEnum.RegionManager.ToString();
            if (RoleDto == "قيادة عليا") return RoleEnum.HighManagement.ToString();
            return string.Empty;
        }

        public string GenerateRandomUsername(int length = 8)
        {
            const string chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var randomBytes = new byte[length];

            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }

            var username = new StringBuilder(length);
            foreach (var b in randomBytes)
            {
                username.Append(chars[b % chars.Length]);
            }

            return username.ToString();
        }
    }
}
