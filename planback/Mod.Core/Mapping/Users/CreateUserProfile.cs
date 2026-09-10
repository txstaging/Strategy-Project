using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Mod.APIs.DTOs.Auth;
using Mod.Core.DTOs.Units;
using Mod.Core.DTOs.Users;

namespace Mod.Core.Mapping.Users
{
    public class CreateUserProfile:Profile
    {
        public CreateUserProfile()
        {
            CreateMap<CreateUserDto, RegisterDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.UserName))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(dest => dest.UnitId, opt => opt.MapFrom(src => src.UnitId))
                .ForMember(dest => dest.Password, opt => opt.MapFrom(src => src.Password))
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.UserRole));
        }
    }
}
