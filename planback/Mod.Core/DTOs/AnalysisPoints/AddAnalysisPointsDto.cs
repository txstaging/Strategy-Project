namespace Mod.Core.DTOs.AnalysisPoints
{
    public class AddAnalysisPointsDto
    {
        public int? Id { get; set; }
        [Required]
        public string Procedures { get; set; } = null!;
        [Required]
        public string Name { get; set; } = null!;
        [Required]
        public double Impact { get; set; }
        [Required]
        public double DegreeOfCertainty { get; set; }
        public double? Priority { get; set; }
        public string? Comment { get; set; }
        [Required]
        public string Type { get; set; }
        public string? Status { get; set; }
    }
}
