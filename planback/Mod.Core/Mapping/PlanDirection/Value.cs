namespace Mod.Core.Mapping.PlanDirection
{
    public class Value:Profile
    {
        public Value()
        {
            CreateMap<DirectionItems, ValueDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.content, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.status, opt => opt.MapFrom(src => src.Status.ToString()));
        }
    }
}
