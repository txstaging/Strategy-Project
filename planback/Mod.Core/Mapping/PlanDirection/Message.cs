namespace Mod.Core.Mapping.PlanDirection
{
    public class Message:Profile
    {
        public Message()
        {
            CreateMap<DirectionItems, MessageDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.content, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.status, opt => opt.MapFrom(src => src.Status.ToString()));
        }
    }
}
