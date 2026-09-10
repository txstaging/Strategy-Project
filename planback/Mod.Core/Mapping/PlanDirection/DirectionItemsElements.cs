namespace Mod.Core.Mapping.PlanDirection
{
    public class DirectionItemsElements : Profile
    {
        public DirectionItemsElements()
        {
            CreateMap<DirectionItemsElementsDto, Mod.Core.Entities.StrategicPlan.DirectionItemsElements>()
                .ForPath(dest => dest.Status, opt => opt.MapFrom(src =>
                    string.IsNullOrEmpty(src.Status) ? ApprovalStatus.Pending
                    : (ApprovalStatus)Enum.Parse(typeof(ApprovalStatus), src.Status, true)
                ))
                .ForPath(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForPath(dest => dest.Comment, opt => opt.MapFrom(src => src.Comment));

            CreateMap<Mod.Core.Entities.StrategicPlan.DirectionItemsElements, DirectionItemsElementsDto>()
                .ForPath(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                .ForPath(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForPath(dest => dest.Comment, opt => opt.MapFrom(src => src.Comment));
        }
    }


}

