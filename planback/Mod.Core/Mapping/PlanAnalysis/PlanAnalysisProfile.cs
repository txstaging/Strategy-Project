namespace Mod.Core.Mapping.PlanAnalysis
{
    public class PlanAnalysisProfile:Profile
    {
        public PlanAnalysisProfile()
        {
            CreateMap<Mod.Core.Entities.StrategicPlan.PlanAnalysis, PlanAnalysisToReturnDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForPath(dest => dest.UnitId, opt => opt.MapFrom(src => src.UnitId))
            .ForMember(dest => dest.PlanId, opt => opt.MapFrom(src => src.PlanId))
            .ForMember(dest => dest.EmployeeName, opt => opt.MapFrom(src => src.User != null ? src.User.DisplayName : "Unknown"))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.DateOfApproval.HasValue ? src.DateOfApproval.Value.ToString("yyyy-MM-dd") : "Not Available"))
            .ForMember(dest => dest.UnitName, opt => opt.MapFrom(src => src.Units != null ? src.Units.Name : "No Unit"));
        }
    }
}
