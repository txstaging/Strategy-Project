using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Mod.Core.DTOs.Initiatives;
using Mod.Core.DTOs.PlanGoals;
using Mod.Core.DTOs.PlanProjects;

namespace Mod.Core.Mapping.PlanProjects
{
    public class PlanProjectProfile:Profile
    {
        public PlanProjectProfile()
        {
            CreateMap<Mod.Core.Entities.StrategicPlan.PlanProjects, GetPlanProjectsDto>()
               .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
               .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
               .ForPath(dest => dest.UnitId, opt => opt.MapFrom(src => src.UnitId))
               .ForMember(dest => dest.PlanId, opt => opt.MapFrom(src => src.PlanId))
                 
                   .ForMember(dest => dest.Code, opt => opt.MapFrom(src => new ProjectItemsDto { Value = src.Code }))
                    .ForMember(dest => dest.Beneficiaries, opt => opt.MapFrom(src => new ProjectItemsDto { Value = src.Beneficiaries.Value,Status=src.Status.ToString() }))// 🛠 حل المشكلة هنا
                    .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => new ProjectItemsDto { Value = src.Priority.Value, Status = src.Status.ToString() }))
                    .ForMember(dest => dest.Duration, opt => opt.MapFrom(src => new ProjectItemsDto { Value = src.Duration.Value, Status = src.Status.ToString() }))
                    .ForMember(dest => dest.SupervisingAuthority, opt => opt.MapFrom(src => new ProjectItemsDto { Value = src.SupervisingAuthority.Value, Status = src.Status.ToString() }))
                    .ForMember(dest => dest.Name, opt => opt.MapFrom(src => new ProjectItemsDto { Value = src.Name.Value, Status = src.Status.ToString() }))

               .ForMember(dest => dest.EmployeeName, opt => opt.MapFrom(src => src.User != null ? src.User.DisplayName : "Unknown"))
               .ForMember(dest => dest.Date, opt => opt.MapFrom(src => src.CreatedAt.HasValue ? src.CreatedAt.Value.ToString("yyyy-MM-dd") : "Not Available"))
                .ForMember(dest => dest.UnitName, opt => opt.MapFrom(src => src.Units != null ? src.Units.Name : "No Unit"))
                .ForMember(dest => dest.StartDate, opt => opt.MapFrom(src => DateOnly.FromDateTime(src.StartDate).ToString("yyyy-MM-dd")))
                .ForMember(dest => dest.EndDate, opt => opt.MapFrom(src => DateOnly.FromDateTime(src.EndDate).ToString("yyyy-MM-dd")))
                
            .ReverseMap();



            CreateMap<Mod.Core.Entities.StrategicPlan.ProjectItems, ProjectItemsDto>()
              .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
              .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
              .ForMember(dest => dest.Value, opt => opt.MapFrom(src => src.Value))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
             .ReverseMap();

        }
    }
}
