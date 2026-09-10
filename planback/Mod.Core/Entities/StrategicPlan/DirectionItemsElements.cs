namespace Mod.Core.Entities.StrategicPlan
{
    public class DirectionItemsElements:BaseEntity
    {
        public string Name { get; set; } = null!;
        public ApprovalStatus Status { get; set; }
        public string? Comment { get; set; }
        public DirectionItems? DirectionItems { get; set; }
        public int? DirectionItemsId { get; set; }
    }
}
