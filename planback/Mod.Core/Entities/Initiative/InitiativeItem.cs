using Mod.Core.Enums;

namespace Mod.Core.Entities.Initiative
{
    public class InitiativeItem : BaseEntity
    {
        public string Value { get; set; }
        public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;
        public string? Comment { get; set; }
        public InitiativeItemType? Type { get; set; }

        //public int PlanInitiativeId { get; set; }
        //public PlanInitiative PlanInitiative { get; set; } = null!;
    }
}
