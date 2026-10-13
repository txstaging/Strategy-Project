using Mod.Core.Entities.Identity;
using Mod.Core.Entities.StrategicPlan;

namespace Mod.Core.Entities
{
    // What a participant brings to a shared project. Persisted as an integer.
    public enum ContributionType
    {
        Budget = 0,       // ميزانية
        Resources = 1,    // موارد
        Execution = 2,    // تنفيذ
        Supervision = 3,  // إشراف
        Other = 4,        // أخرى
    }

    // Where the participant's action stands. Persisted as an integer.
    public enum ContributionStatus
    {
        Planned = 0,     // مخطط
        InProgress = 1,  // جارٍ
        Done = 2,        // منجز
    }

    // «قائمة المشاريع المشتركة» — checklist item 24. One party taking part in
    // a project that is shared across departments, and the action it commits
    // to: a budget, resources, part of the execution, supervision, or something
    // else. A participant is usually a unit; a free-text party covers partners
    // outside the organisation.
    public class SharedProjectParticipant : BaseEntity
    {
        public int ProjectId { get; set; }
        public PlanProjects? Project { get; set; }

        public int? UnitId { get; set; }
        public Units? Unit { get; set; }

        // Used when the participant is not one of our units.
        public string? PartyName { get; set; }

        public ContributionType ContributionType { get; set; }

        // الإجراء — what this participant will do.
        public string Contribution { get; set; } = null!;

        // Meaningful for budget contributions.
        public decimal? Amount { get; set; }

        public ContributionStatus Status { get; set; } = ContributionStatus.Planned;

        public string? Notes { get; set; }

        public int CreatedByUserId { get; set; }
        public AppUser? CreatedByUser { get; set; }
    }
}
