using AutoMapper;
using Mod.Core.DTOs.Initiatives;
using Mod.Core.Entities.Initiative;
using Mod.Core.Enums;

namespace Mod.Core.Mapping.Initiative
{
    public class InitiativeProfile : Profile
    {
        public InitiativeProfile()
        {

            #region PlanInitiative
            // Mapping for AddInitiativesDto to PlanInitiative
            //CreateMap<AddInitiativesDto, Entities.Initiative.PlanInitiative>()
            //    .ForMember(dest => dest.GoalId, opt => opt.MapFrom(src => src.GoalId))
            //    .ForMember(dest => dest.InitiativeKpis, opt => opt.MapFrom(src => src.InitiativeKPIs))
            //    .ForMember(dest => dest.AdminInCharge, opt => opt.MapFrom(src => src.AdminInCharge))
            //    .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            //    .ForMember(dest => dest.Partners, opt => opt.MapFrom(src => src.Partners))

            //    .ForMember(dest => dest.Obstacles, opt => opt.MapFrom(src => src.Obstacles))
            //    .ReverseMap();

            //CreateMap<Entities.Initiative.PlanInitiative, GetInitiativesDto>()
            //    .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            //    .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            //    .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            //    .ForMember(dest => dest.GoalId, opt => opt.MapFrom(src => src.GoalId))
            //    .ForPath(dest => dest.Goals.Name, opt => opt.MapFrom(src => src.Goal.Name.Value))
            //    .ForPath(dest => dest.Goals.Description, opt => opt.MapFrom(src => src.Goal.Descripition.Value))
            //    .ForPath(dest => dest.Goals.Indicator, opt => opt.MapFrom(src => src.Goal.Indicator.Value))
            //    .ForPath(dest => dest.Goals.Status, opt => opt.MapFrom(src => src.Goal.Status.ToString()))
            //    .ForPath(dest => dest.Goals.Id, opt => opt.MapFrom(src => src.Goal.Id))

            //    .ForMember(dest => dest.PlanId, opt => opt.MapFrom(src => src.PlanId))
            //    .ForMember(dest => dest.UnitId, opt => opt.MapFrom(src => src.UnitId))
            //    .ForMember(dest => dest.AdminInCharge, opt => opt.MapFrom(src => src.AdminInCharge))
            //    .ForMember(dest => dest.Partners, opt => opt.MapFrom(src => src.Partners))
            //    .ForMember(dest => dest.Obstacles, opt => opt.MapFrom(src => src.Obstacles))
            //    .ForMember(dest => dest.InitiativeKPIs, opt => opt.MapFrom(src => src.InitiativeKpis))
            //    .ReverseMap();

            //CreateMap<UpdateInitiativesDto, Entities.Initiative.PlanInitiative>()
            //    .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            //    .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            //    .ForMember(dest => dest.Comment, opt => opt.MapFrom(src => src.Comment))
            //    .ForMember(dest => dest.GoalId, opt => opt.MapFrom(src => src.GoalId))
            //    .ForMember(dest => dest.AdminInCharge, opt => opt.MapFrom(src => src.AdminInCharge))
            //    .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            //    .ForMember(dest => dest.Partners, opt => opt.MapFrom(src => src.Partners))
            //    .ForMember(dest => dest.Obstacles, opt => opt.MapFrom(src => src.Obstacles))
            //    .ForMember(dest => dest.InitiativeKpis, opt => opt.MapFrom(src => src.InitiativeKPIs))
            //    .ReverseMap();
            //#endregion

            //#region InitiativeItem

            //// Mapping for InitiativeItemAddDto to InitiativeItem
            //CreateMap<InitiativeItemAddDto, InitiativeItem>()
            //    .ForMember(dest => dest.Value, opt => opt.MapFrom(src => src.Value))
            //    .ForMember(dest => dest.Status, opt => ApprovalStatus.Pending.ToString())
            //    .ReverseMap();

            //// Mapping for InitiativesItemDto to InitiativeItem
            //CreateMap<InitiativesItemDto, InitiativeItem>()
            //    .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            //    .ForMember(dest => dest.Value, opt => opt.MapFrom(src => src.Value))
            //    .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            //    .ForMember(dest => dest.Comment, opt => opt.MapFrom(src => src.Comment))
            //    .ReverseMap();
            //#endregion

            //#region InitiativeKpi
            //// Mapping for InitiativeKpiDto to InitiativeKpi
            //CreateMap<InitiativeKpiDto, InitiativeKpi>()
            //    .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            //    .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            //    .ForMember(dest => dest.Comment, opt => opt.MapFrom(src => src.Comment))
            //    .ForMember(dest => dest.Value, opt => opt.MapFrom(src => src.Value))
            //    .ReverseMap();

            //// Mapping for InitiativeKpiDto to InitiativeKpi
            //CreateMap<InitiativeKpi, InitiativeKpiDto>()
            //    .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            //    .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            //    .ForMember(dest => dest.Comment, opt => opt.MapFrom(src => src.Comment))
            //    .ForMember(dest => dest.Value, opt => opt.MapFrom(src => src.Value))
            //    .ReverseMap();

            //// Mapping for InitiativeKpiAddDto to InitiativeKpi
            //CreateMap<InitiativeKpiAddDto, InitiativeKpi>()
            //    .ForMember(dest => dest.Value, opt => opt.MapFrom(src => src.Value))
            //    .ForMember(dest => dest.Status, opt => ApprovalStatus.Pending.ToString())
            //    .ReverseMap();
            #endregion

        }
    }
}
