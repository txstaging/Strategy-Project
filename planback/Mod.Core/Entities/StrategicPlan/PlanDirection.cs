namespace Mod.Core.Entities.StrategicPlan
{
    public class PlanDirection:BaseEntity
    {
        public int UnitId { get; set; }
        public Units Units { get; set; } = null!;
        public int PlanId { get; set; }
        public Plans Plan { get; set; }
        public int? AppUserId { get; set; }
        public AppUser? User { get; set; }
        public ApprovalStatus Status { get; set; }
        
        public ICollection<DirectionItems> DirectionItems { get; set; }=new HashSet<DirectionItems>();


    }
}
