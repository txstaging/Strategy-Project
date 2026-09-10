using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Mod.Core.DTOs.PlanDirection;
using Mod.Core.DTOs.PlanGoals;
using Mod.Core.Entities.StrategicPlan;

namespace Mod.Core.Mapping.PlanGoals
{
    public class GoalItemsProfile:Profile
    {
        public GoalItemsProfile()
        {
            CreateMap<GoalItems, GoalItemDto>()
           .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
           .ForMember(dest => dest.Value, opt => opt.MapFrom(src => src.Value))
           .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        }
    }
}
