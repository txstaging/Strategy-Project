using Mod.Core.Enums;

namespace Mod.Core.Entities.Initiative
{
    public class InitiativeKpi : BaseEntity
    {
        public string Value { get; set; }
        public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;
        public string? Comment { get; set; }

        // Navigation Property
        public int InitiativeId { get; set; }  // Foreign Key
        public virtual PlanInitiative Initiative { get; set; }
    }
}
