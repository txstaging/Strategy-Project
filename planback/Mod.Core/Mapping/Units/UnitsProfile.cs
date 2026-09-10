namespace Mod.Core.Mapping.Units
{
    public class UnitsProfile : Profile
    {
        public UnitsProfile()
        {
            CreateMap<Mod.Core.Entities.Units,UnitsToReturnDto>()
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name)) 
            
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id));


            CreateMap<UnitsToReturnDto, Mod.Core.Entities.Units>()
       .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
       .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id));
        }
    }
}
