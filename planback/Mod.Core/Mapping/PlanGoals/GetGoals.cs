using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Mod.Core.DTOs.PlanAnalysis;
using Mod.Core.DTOs.PlanGoals;

namespace Mod.Core.Mapping.PlanGoals
{
    public class GetGoals:Profile
    {
        public GetGoals()
        {
            CreateMap<Mod.Core.Entities.StrategicPlan.PlanGoals, GetGoalsDto>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForPath(dest => dest.UnitId, opt => opt.MapFrom(src => src.UnitId))
                .ForMember(dest => dest.PlanId, opt => opt.MapFrom(src => src.PlanId))
                .ForMember(dest => dest.EmployeeName, opt => opt.MapFrom(src => src.User != null ? src.User.DisplayName : "Unknown"))
                .ForMember(dest => dest.Date, opt => opt.MapFrom(src => src.CreatedAt.HasValue ? src.CreatedAt.Value.ToString("yyyy-MM-dd") : "Not Available"))
                .ForMember(dest => dest.UnitName, opt => opt.MapFrom(src => src.Units != null ? src.Units.Name : "No Unit"));



        }
    }
}
