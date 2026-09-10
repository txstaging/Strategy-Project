using Mod.Core.Entities.Identity;
using Mod.Core.Enums;

namespace Mod.Core.Entities.StrategicPlan
{
    public class ProjectPercentageHistory : BaseEntity
    {
        public int ProjectId { get; set; }
        public PlanProjects Project { get; set; } = null!;

        public string Value { get; set; } = null!;
        public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;
        public string? Comment { get; set; }

        // Optional attachment uploaded with the percentage submission.
        public string? FilePath { get; set; }

        public int? AppUserId { get; set; }
        public AppUser? User { get; set; }
    }
}
