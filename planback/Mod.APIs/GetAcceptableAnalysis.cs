namespace Mod.APIs
{
    public class GetAcceptableAnalysis
    {
        public ICollection<GetAcceptableAnalysisPointDto>Streanth { get; set; } = new List<GetAcceptableAnalysisPointDto>();
        public ICollection<GetAcceptableAnalysisPointDto> Risks { get; set; } = new List<GetAcceptableAnalysisPointDto>();
        public ICollection<GetAcceptableAnalysisPointDto> Opportunities { get; set; } = new List<GetAcceptableAnalysisPointDto>();
        public ICollection<GetAcceptableAnalysisPointDto> Threats { get; set; } = new List<GetAcceptableAnalysisPointDto>();
    }
}
