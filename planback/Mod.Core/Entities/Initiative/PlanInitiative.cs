using Mod.Core.Entities.Identity;
using Mod.Core.Entities.StrategicPlan;
using Mod.Core.Enums;

namespace Mod.Core.Entities.Initiative
{
    public class PlanInitiative : BaseEntity
    {
        public ApprovalStatus? Status { get; set; } = ApprovalStatus.Pending;
        public string? Comment { get; set; }

        // Navigation Properties
        public int? AppUserId { get; set; }
        public AppUser? User { get; set; }
        public InitiativeItem Name { get; set; }
        [ForeignKey("Name")]
        public int NameId { get; set; }

        public ICollection<InitiativeItem> InitiativeItems { get; set; } = new HashSet<InitiativeItem>();




        public double InitiativeWeight { get; set; } = 0;
        public double? Percentage { get; set; }
        public int UnitId { get; set; }
        public Units Unit { get; set; }
        public int PlanId { get; set; }
        public Plans Plan { get; set; }
        public int GoalId { get; set; }
        public PlanGoals Goal { get; set; }
        public virtual ICollection<InitiativeKpi> InitiativeKpis { get; set; } = new HashSet<InitiativeKpi>();
        public PlanInitiativeStep? PlanInitiativeStep { get; set; }
        public int? PlanInitiativeStepId { get; set; }
        public ICollection<PlanProjects> PlanProjects { get; set; } = new HashSet<PlanProjects>();
    }
    public enum InitiativeItemType
    {
        AdminInCharge=1,
      
        Partner=2,
        Obstacle=3
    }
}
