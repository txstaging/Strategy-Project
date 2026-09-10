using Azure;
using Microsoft.EntityFrameworkCore;
using Mod.Core.Entities;
using Mod.Core.Mapping.PlanDirection;
using System.Runtime.CompilerServices;
using System.Security.Claims;
using System.Security.Cryptography;
using static System.Net.WebRequestMethods;

namespace Mod.APIs.Controllers
{
    public class AccountController(SignInManager<AppUser> signInManager, UserManager<AppUser> userManager, RoleManager<UserRole> roleManager, IAuthService authService, ICurrentUserService currentUserService, IPlansRepository planService, IServiceScopeFactory scopeFactory, ModContext context, IUserClaimsService userClaimsService) : BaseController
    {
        #region Fields
        private readonly SignInManager<AppUser> _signInManager = signInManager;
        private readonly UserManager<AppUser> _userManager = userManager;
        private readonly RoleManager<UserRole> _roleManager = roleManager;
        private readonly IAuthService _authService = authService;
        private readonly ICurrentUserService _currentUserService = currentUserService;
        private readonly IPlansRepository planService = planService;
        private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
        private readonly ModContext _context = context;
        private readonly IUserClaimsService userClaimsService= userClaimsService;


        #endregion

        #region APIs
        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login([FromBody] LoginDto model)
        {

            var user = await _userManager.FindByEmailAsync(model.Email);
            var roles = await _userManager.GetRolesAsync(user);
            user.Role = roles.FirstOrDefault();

            if (user is null || user.IsActive == false || user.IsDeleted == true)
            {
                return Unauthorized(new AuthResponseFailDto<string>(
                    "Invalid Credentials",
                    ""

                ));
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
            if (!result.Succeeded)
            {
                return Unauthorized(new AuthResponseFailDto<string>(
                    "Invalid Credentials",
                    ""
                ));
            }
            var id = user.UnitId is null ? 0 : user.UnitId;
            var plan = await planService.GetLastPlan((int)id);
            int planid = plan is null ? 0 : plan.Id;






            var token = await _authService.CreateToken(user, _userManager);

            return Ok(
                new APIsGenralResponseDto<LoginResponseSuccessDto<string>>(
                    "Success",
                    new LoginResponseSuccessDto<string>(token) { Permissions = await CreateClaimsResponse(user), PlanId = planid }
                )
            );
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<APIsGenralResponseDto<UserDto>>> GetCurrentUser()
        {
            var user = await _currentUserService.GetCurrentUserAsync();
            if (user == null) return Unauthorized();
            var id = user.UnitId is null ? 0 : user.UnitId;
            var plan = await planService.GetLastPlan((int)id);
            int planid = plan is null ? 0 : plan.Id;

            return Ok(new APIsGenralResponseDto<UserDto>(
                "Success",
                new UserDto
                {
                    Id = user!.Id,
                    Email = user!.Email,
                    Role = user.Role!,
                    Name = user!.DisplayName,
                    PlanId = planid,
                    Permissions = await CreateClaimsResponse(user)
                }
            ));
        }


        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            string message = ValidatePermissions(model.ModulePermissions);
            if (message != string.Empty)
                return BadRequest(message);

            // Check email uniqueness up front
            var existing = await _userManager.FindByEmailAsync(model.Email);
            if (existing != null)
            {
                return BadRequest(new AuthResponseFailDto<IEnumerable<string>>(
                    "User creation failed",
                    new List<string> { "Email is already registered" }
                ));
            }

            // Validate role BEFORE creating the user to avoid orphaned accounts
            if (!string.IsNullOrEmpty(model.Role) && !await _roleManager.RoleExistsAsync(model.Role))
            {
                return BadRequest(new AuthResponseFailDto<IEnumerable<string>>(
                    "Role does not exist",
                    new List<string> { "The specified role does not exist" }
                ));
            }

            // Roles above units (RegionManager, HighManagement, Admin) are not scoped to a unit.
            // For unit-scoped roles, UnitId must be provided.
            var rolesAboveUnit = new[] { nameof(RoleEnum.RegionManager), nameof(RoleEnum.HighManagement), "Admin" };
            var isAboveUnit = !string.IsNullOrEmpty(model.Role) && rolesAboveUnit.Contains(model.Role);
            if (!isAboveUnit && (model.UnitId == null || model.UnitId == 0))
            {
                return BadRequest(new AuthResponseFailDto<IEnumerable<string>>(
                    "User creation failed",
                    new List<string> { "UnitId is required for this role" }
                ));
            }

            var user = new AppUser
            {
                DisplayName = model.UserName,
                Email = model.Email,
                Phone = model.PhoneNumber,
                UnitId = isAboveUnit ? null : model.UnitId,
                UserName = model.UserName,
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
            {
                return BadRequest(new AuthResponseFailDto<IEnumerable<string>>(
                    "User creation failed",
                    result.Errors.Select(e => e.Description)
                ));
            }

            if (!string.IsNullOrEmpty(model.Role))
            {
                try
                {
                    await _userManager.AddToRoleAsync(user, model.Role);
                    await AssignRoleClaimsAsync(user, model.Role, model.ModulePermissions ?? new Dictionary<string, List<string>>());
                }
                catch
                {
                    // Roll back the partially-created user so we don't leave orphans
                    await _userManager.DeleteAsync(user);
                    throw;
                }
            }

            return Ok(new RegisterResponseSuccessDto<UserDto>(
                new UserDto
                {
                    Id = user.Id,
                    Email = model.Email,
                    Name = model.UserName,
                    Role = model.Role,
                }
            ));
        }

        [HttpPost("register/v2")]
        public async Task<IActionResult> RegisterV2([FromBody] RegisterDto model)
        {
            var h = await _userManager.FindByEmailAsync(model.Email);
            if (h != null) return Ok(new { Message = "User Email Is Alredy Exist" });

            // Validate permissions
            var permissionValidationMessage = ValidatePermissions(model.ModulePermissions);
            if (!string.IsNullOrEmpty(permissionValidationMessage))
                return BadRequest(permissionValidationMessage);

            // Validate role BEFORE user creation to avoid orphaned accounts
            if (string.IsNullOrEmpty(model.Role) || !await _roleManager.RoleExistsAsync(model.Role))
            {
                return BadRequest(new AuthResponseFailDto<IEnumerable<string>>(
                    "Role does not exist",
                    new List<string> { "The specified role does not exist" }
                ));
            }

            // Unit-scoped roles must specify a UnitId; roles above units must not.
            var rolesAboveUnitV2 = new[] { nameof(RoleEnum.RegionManager), nameof(RoleEnum.HighManagement), "Admin" };
            if (!rolesAboveUnitV2.Contains(model.Role) && (model.UnitId == null || model.UnitId == 0))
            {
                return BadRequest(new AuthResponseFailDto<IEnumerable<string>>(
                    "User creation failed",
                    new List<string> { "UnitId is required for this role" }
                ));
            }

            // Create user
            var user = CreateAppUserFromModel(model);
            var userCreationResult = await _userManager.CreateAsync(user, model.Password);
            if (!userCreationResult.Succeeded)
                return BadRequest(userCreationResult.Errors);

            try
            {
                await _userManager.AddToRoleAsync(user, model.Role);
                await AssignRoleClaimsAsync(user, model.Role, model.ModulePermissions);
            }
            catch
            {
                // Roll back the partially-created user so we don't leave orphans
                await _userManager.DeleteAsync(user);
                throw;
            }

            return Ok(new { Message = "ok" });
        }



        [HttpPost("update-permissions/{userId}")]
        public async Task<IActionResult> UpdateUser(int userId, [FromBody] UpdatePermessionsDto request)
        {
            if (userId != request.UserId) return BadRequest("User Id dosnot match.");

            string message = ValidatePermissions(request.ModulePermissions);
            if (message != string.Empty)
                return BadRequest(message);

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return NotFound("User not found.");

            await UpdateUserRoleAndClaimsAsync(user, request.Role, request.ModulePermissions);
            return Ok(new { Message = "User updated successfully" });


        }
        [HttpPost("UpdateUser/{userId}")]
        public async Task<IActionResult> UpdateUserv2(int userId, [FromBody] UpdateUserDtoo request)
        {




            var user = await _userManager.FindByIdAsync(request.UserId.ToString());
            if (user == null) return NotFound("User not found.");

            if (!string.IsNullOrWhiteSpace(request.UserName))
            {
                user.DisplayName = request.UserName;

            }
            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                user.Email = request.Email;

            }
            if (request.PhoneNumber != null)
            {
                user.Phone = request.PhoneNumber;
            }
            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
                return BadRequest(updateResult.Errors);
            if (request.Password != null)
            {
                if (!string.IsNullOrWhiteSpace(request.Password))
                {
                    var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                    var passwordResult = await _userManager.ResetPasswordAsync(user, token, request.Password);
                    if (!passwordResult.Succeeded)
                        return BadRequest(passwordResult.Errors);
                }
            }






            // ✅ Reset password safely


            return Ok(new { Message = "User updated successfully" });
        }
        [HttpGet("GetAllUsers")]
        public async Task<IActionResult> GetAllUsers([FromQuery] int perPage = 5, [FromQuery] int page = 1)
        {
            var users = await _userManager.Users
                .Where(u => u.IsDeleted != true).Include(u => u.Units)
                .ToListAsync();


            var userDtos = new List<object>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userDtos.Add(new
                {
                    user.Id,
                    user.DisplayName,
                    Role = roles.FirstOrDefault() ?? "No Role",
                    UnitName = user.Units?.Name ?? "لا يوجد وحدة",

                    IsActive = user.IsActive ?? false
                });
            }
            var totalCount = userDtos.Count;
            var totalPages = (int)Math.Ceiling((double)totalCount / perPage);

            // تأكد من أن الصفحة لا تقل عن 1
            page = page < 1 ? 1 : page;

            var paginatedBlogs = userDtos
                .Skip((page - 1) * perPage)
                .Take(perPage)
                .ToList();


            var metadata = new MetaDataDto
            {
                CurrentPage = page,
                PerPage = perPage,
                Total = totalCount,
                From = ((page - 1) * perPage) + 1,
                To = Math.Min(page * perPage, totalCount),
                LastPage = totalPages
            };

            return Ok(new APIsResponseFilterDto<Object>
            {
                Data = paginatedBlogs,
                Metadata = metadata
            });


        }
        [HttpGet("GetUser/{UserId}")]
        public async Task<IActionResult> GetUser(int UserId)
        {
            var users = await _userManager.Users
                .Where(u => u.Id == UserId && u.IsDeleted != true).Include(i => i.Units)
                .FirstOrDefaultAsync(i => i.Id == UserId);


            var roles = await _userManager.GetRolesAsync(users);
            var userDtos = new
            {
                users.Id,
                users.DisplayName,
                Role = roles.FirstOrDefault() ?? "No Role",
                IsActive = users.IsActive ?? false,
                users.Email,
                users.Phone,
                users.Units.Name,
                users.PasswordV2


            };



            return Ok(userDtos);
        }
        [HttpPost("AccountSuspension/{UserId}")]
        public async Task<IActionResult> AccountSuspension(int UserId)
        {
            var user = await _userManager.FindByIdAsync(UserId.ToString());
            if (user == null) return NotFound("User not found.");
            user.IsActive = !user.IsActive; // Toggle the IsActive status
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);
            return Ok(new { Message = "User account status updated successfully", IsActive = user.IsActive });
        }
        [HttpDelete("DeleteUser/{UserId}")]
        public async Task<IActionResult> DeleteUser(int UserId)
        {
            var user = await _userManager.FindByIdAsync(UserId.ToString());
            if (user == null) return NotFound("User not found.");
            user.IsDeleted = true; // Mark the user as deleted
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);
            return Ok(new { Message = "User deleted successfully" });
        }


        [HttpGet("Permissions")]
        public async Task<IActionResult> GetAllPermissions()
        {
            List<string> moduleList = GetConstants(typeof(AuthConstants.Modules));
            List<string> permissionList = GetConstants(typeof(AuthConstants.Permissions));

            // Example: Create a dictionary or other data structure to return
            var data = new
            {
                Modules = moduleList,
                Permissions = permissionList
            };

            return Ok(data);
        }

        [HttpGet("UserPermessions/{userId}")]
        public async Task<IActionResult> GetUserPermissions(int userId)
        {
            AppUser? user = await _userManager.FindByIdAsync(userId.ToString());

            return Ok(new { Permissions = await CreateClaimsResponse(user) });
        }


        [HttpGet("GetAllUsersRolesAndPermissions")]

        public async Task<IActionResult> GetAllUsersRolesAndPermissions([FromQuery] string? role = null)
        {

            //var user = await _currentUserService.GetCurrentUserAsync();


            var users = await _userManager.Users.ToListAsync();

            // Run GetRolesAsync in parallel using scoped services
            var userRoleTasks = users.Select(async userItem =>
            {
                using var scope = _scopeFactory.CreateScope();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
                userItem.Role = (await userManager.GetRolesAsync(userItem)).FirstOrDefault();
                return userItem;
            });

            users = (await Task.WhenAll(userRoleTasks)).ToList();

            if (!string.IsNullOrEmpty(role))
            {
                users = users.Where(u => u.Role == role).ToList();
            }

            // Run CreateClaimsResponse in parallel using scoped services
            var userPermissionsTasks = users.Where(i => i.IsDeleted == false).Select(async item =>
            {
                using var scope = _scopeFactory.CreateScope();
                var yourService = scope.ServiceProvider.GetRequiredService<IUserClaimsService>();
                // Replace with the actual service that has CreateClaimsResponse
                return new
                {
                    Name = item.DisplayName,
                    Id = item.Id,
                    Permissions = await yourService.CreateClaimsResponse(item)
                };
            });

            var userPermissions = await Task.WhenAll(userPermissionsTasks);

            return Ok(userPermissions.ToList());
        }


        #endregion

        #region Methods
        private async Task<Dictionary<string, List<string>>> CreateClaimsResponse(AppUser user)
        {
            if (user == null) throw new ArgumentNullException(nameof(user));

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

        private string ValidatePermissions(Dictionary<string, List<string>> ModulePermissions)
        {
            if (ModulePermissions == null || ModulePermissions.Count == 0)
                return string.Empty;

            List<string> moduleList = GetConstants(typeof(AuthConstants.Modules));
            List<string> permissionList = GetConstants(typeof(AuthConstants.Permissions));
            foreach (var item in ModulePermissions)
            {

                if (!moduleList.Contains(item.Key))
                    return $"There is no Module with this name {item.Key}";

                foreach (var permission in item.Value)
                {
                    if (!permissionList.Contains(permission))
                        return $"There is no permission with this name {permission}";
                }
            }

            return string.Empty;
        }

        private string GenerateRandomUsername(int length = 8)
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
        private AppUser CreateAppUserFromModel(RegisterDto model)
        {
            string newUserName = GenerateRandomUsername();
            // Strip the unit assignment for roles that sit above units in the hierarchy.
            var rolesAboveUnit = new[] { nameof(RoleEnum.RegionManager), nameof(RoleEnum.HighManagement), "Admin" };
            var isAboveUnit = !string.IsNullOrEmpty(model.Role) && rolesAboveUnit.Contains(model.Role);
            return new AppUser
            {
                DisplayName = model.UserName, // الاسم العربي يبقى في DisplayName فقط
                Email = model.Email,
                Phone = model.PhoneNumber,
                UnitId = isAboveUnit ? null : model.UnitId,
                UserName = newUserName,
                Number = model.PhoneNumber.ToString(),
                PasswordV2 = model.Password, // حفظ كلمة المرور الجديدة
            };
        }
        private async Task<IActionResult> UpdateUserRoleAndClaimsAsync(AppUser user, string newRole, Dictionary<string, List<string>> modulePermissions)
        {
            if (!await _roleManager.RoleExistsAsync(newRole))
            {
                return BadRequest(new AuthResponseFailDto<IEnumerable<string>>(
                    "Role does not exist",
                    new List<string> { "The specified role does not exist" }
                ));
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, newRole);

            // Always remove existing claims and reassign
            var existingClaims = await _userManager.GetClaimsAsync(user);
            foreach (var claim in existingClaims)
            {
                await _userManager.RemoveClaimAsync(user, claim);
            }

            // AssignRoleClaimsAsync handles HighManagement/Admin automatically
            await AssignRoleClaimsAsync(user, newRole, modulePermissions ?? new Dictionary<string, List<string>>());

            return null;
        }
        private async Task<IActionResult> ValidateAndAssignRoleAsync(AppUser user, string role)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                return BadRequest(new AuthResponseFailDto<IEnumerable<string>>(
                    "Role does not exist",
                    new List<string> { "The specified role does not exist" }
                ));
            }

            await _userManager.AddToRoleAsync(user, role);
            return null; // No error
        }
        private async Task AssignRoleClaimsAsync(AppUser user, string role, Dictionary<string, List<string>> modulePermissions)
        {
            var roleEntity = await _roleManager.FindByNameAsync(role);
            if (roleEntity == null) return;

            await _userManager.AddClaimAsync(user, new Claim(role, role));

            // HighManagement and Admin get ALL permissions automatically
            if (role == "HighManagement" || role == "Admin")
            {
                var allPermissions = GetAllModulePermissions();
                await AssignClaims(user, allPermissions);
            }
            else
            {
                await AssignClaims(user, modulePermissions);
            }
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
        private async Task<bool> AssignClaims(AppUser user, Dictionary<string, List<string>> modulePermissions)
        {
            try
            {
                foreach (var permission in modulePermissions)
                {
                    foreach (var item in permission.Value)
                    {
                        var claim = new Claim(permission.Key, item, permission.Key + "." + item);
                        var claimExists = (await _userManager.GetClaimsAsync(user)).Any(c => c.Type == permission.Key && c.Value == item);

                        if (!claimExists)
                        {
                            await _userManager.AddClaimAsync(user, claim);
                        }
                    }
                }
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }
        private RegisterResponseSuccessDto<UserDto> CreateRegisterResponse(AppUser user, RegisterDto model)
        {
            return new RegisterResponseSuccessDto<UserDto>(
                new UserDto
                {
                    Id = user.Id,
                    Email = model.Email,
                    Name = model.UserName,
                    Role = model.Role,
                }
            );
        }
        private List<string> GetConstants(Type type) // Take a Type as a parameter
        {
            FieldInfo[] fields = type.GetFields(BindingFlags.Public | BindingFlags.Static);
            return fields.Select(field => field.GetValue(null) as string).ToList();
        }
        #endregion
    }
}
