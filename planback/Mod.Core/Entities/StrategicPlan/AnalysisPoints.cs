namespace Mod.Core.Entities.StrategicPlan
{
    public class AnalysisPoints:BaseEntity
    {
        public string Procedures { get; set; } = null!;
        public string Name { get; set; } = null!;
        public double Impact { get; set; }
        public double DegreeOfCertainty { get; set; }
        public double? Priority { get; set; }
        public string? Comment { get; set; }
        public ApprovalStatus Status { get; set; }
        public AnalysisPointsType Type { get; set; }
        [ForeignKey(nameof(Plans))]
        public int PlanId { get; set; }
        public Plans Plans { get; set; }
        public int AnalysisId { get; set; }
        public PlanAnalysis PlanAnalysis { get; set; }
        public ICollection<PlanGoals> PlanGoals { get; set; } = new HashSet<PlanGoals>();
    }
}
