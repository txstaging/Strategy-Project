using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Mod.Core.DTOs.PlanGoals;
using Mod.Core.DTOs.PlanProjects;

namespace Mod.Core.Mapping.PlanInitiative
{
    public class GetAcceptableGoalsProfile:Profile
    {
        public GetAcceptableGoalsProfile()
        {
            CreateMap<Mod.Core.Entities.StrategicPlan.PlanGoals, GetAcceptableGoalsDto>()
               .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
               .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name.Value))
               .ForMember(dest => dest.Indicator, opt => opt.MapFrom(src => src.Indicator.Value))
               .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Descripition.Value))
               .ReverseMap();
        }
    }
}
