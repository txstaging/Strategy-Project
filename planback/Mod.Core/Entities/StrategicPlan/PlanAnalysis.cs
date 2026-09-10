namespace Mod.Core.Entities.StrategicPlan
{
    public class PlanAnalysis:BaseEntity
    {
        public int UnitId { get; set; }
        public Units Units { get; set; } = null!;
        public int PlanId { get; set; }
        public Plans Plan { get; set; }
        public ApprovalStatus Status { get; set; }
        public ICollection<AnalysisPoints> AnalysisPoints { get; set; } = new HashSet<AnalysisPoints>();
        public int? AppUserId { get; set; }
        public AppUser? User { get; set; }
        public DateTime? DateOfApproval { get; set; }
    }
}
