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
    public class GetAcceptableAnalysisPointProfile:Profile
    {
        public GetAcceptableAnalysisPointProfile()
        {
            CreateMap<Mod.Core.Entities.StrategicPlan.AnalysisPoints, GetAcceptableAnalysisPointDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ReverseMap();

            
        }
    }
}
