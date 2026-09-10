using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Mod.APIs.DTOs.Auth;
using Mod.Core.DTOs.APIsResponse;
using Mod.Core.DTOs.Users;

namespace Mod.Core.Services.Contract.UserService
{
    public interface IUserService
    {
        Task<object> RegisterAsync(RegisterDto model);
        Task<APIsGenralResponseDto<CreateUserDto>>CreateUser(CreateUserDto model);
         string ReturnRoleName(string RoleDto);
    }
}
