using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Mod.Core.DTOs.PlanProjects;

namespace Mod.Core.Mapping.PlanInitiative
{
    public class GetAcceptableInitiativeProfile:Profile
    {
        public GetAcceptableInitiativeProfile()
        {
            //CreateMap<Mod.Core.Entities.Initiative.PlanInitiative, GetAcceptableInitiativeDto>()
            //   .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            //   .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name.Value))
            //   .ReverseMap();
        }
    }
}
