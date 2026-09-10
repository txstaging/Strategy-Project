namespace Mod.Core.Entities.StrategicPlan
{
    public class DirectionItems:BaseEntity
    {
        public string Name { get; set; } = null!;
        public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;
        public StrategicDirectionPointType Type { get; set; }
        public string? Comment { get; set; }
        public int? PlanDirectionId { get; set; }
        public PlanDirection? PlanDirection { get; set; }
        public ICollection<DirectionItemsElements> DirectionItemsElements { get; set; } = new HashSet<DirectionItemsElements>();

    }
}
