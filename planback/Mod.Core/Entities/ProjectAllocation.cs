using Mod.Core.Entities.Identity;
using Mod.Core.Entities.StrategicPlan;

namespace Mod.Core.Entities
{
    // What a line allocated to a project is. Persisted as an integer, so pinned.
    public enum AllocationKind
    {
        Resource = 0,   // الموارد
        Budget = 1,     // الميزانيات
        Contract = 2,   // العقود
    }

    // «إدارة الموارد والميزانيات والعقود» — checklist item 22. One resource,
    // budget line or contract attached to a project. Kept deliberately flat:
    // a name, an optional amount, and a note.
    public class ProjectAllocation : BaseEntity
    {
        public int ProjectId { get; set; }
        public PlanProjects? Project { get; set; }

        public AllocationKind Kind { get; set; }

        public string Name { get; set; } = null!;

        // Meaningful for budgets and contracts; a resource may have none.
        public decimal? Amount { get; set; }

        public string? Notes { get; set; }

        public int CreatedByUserId { get; set; }
        public AppUser? CreatedByUser { get; set; }
    }
}
