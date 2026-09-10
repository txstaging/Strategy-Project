namespace Mod.Core.Mapping.AnalysisPoints
{
    public class MapFromAnalysisPointsToAnalysisPointsProfile:Profile
    {
        public MapFromAnalysisPointsToAnalysisPointsProfile()
        {
            CreateMap<Mod.Core.Entities.StrategicPlan.AnalysisPoints, AddAnalysisPointsDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ReverseMap()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src =>
                Enum.Parse(typeof(AnalysisPointsType), src.Type)))
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id));
        }
    }
}
