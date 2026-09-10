namespace Mod.Core.DTOs.Plans
{
    public class PlanFilterDto
    {
        public string? Filter { get; set; }
        public int? Unit { get; set; }
        public int? Year { get; set; }
        public int Page { get; set; } 
        public int PerPage { get; set; } 
    }
}
