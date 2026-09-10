namespace Mod.Core.DTOs.Plans
{
    public class GetAllPlanDto
    {
        public string Name { get; set; }
        public int Id { get; set; }
        public UnitsToReturnDto Unit { get; set; } = null!;
        public DateOnly? Date { get; set; } = DateOnly.FromDateTime(DateTime.Now);
        public PlanAnalysisToReturnDto PlanAnalysis { get; set; }
        public string? CurrentStage { get; set; }
    }
}
