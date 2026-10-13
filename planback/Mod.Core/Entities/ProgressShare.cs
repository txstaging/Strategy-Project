using Mod.Core.Entities.Identity;

namespace Mod.Core.Entities
{
    // What a progress share can be about: one project, one initiative, or
    // everything a unit has achieved. Persisted as an integer, so pinned.
    public enum ProgressScope
    {
        Project = 0,
        Initiative = 1,
        Unit = 2,
    }

    // «مشاركة نسبة الإنجاز» — a user sends the progress figure of a project, an
    // initiative or a whole unit to chosen people. The figure and the name are
    // captured at send time, so the recipient sees exactly what was shared even
    // after the live number moves on.
    public class ProgressShare : BaseEntity
    {
        public int SentByUserId { get; set; }
        public AppUser? SentByUser { get; set; }

        public ProgressScope Scope { get; set; }
        public int ScopeId { get; set; }

        // Snapshot at send time.
        public string ScopeName { get; set; } = null!;
        public double Percentage { get; set; }

        // The plan the item belongs to, when it has one. A unit share has none.
        public int? PlanId { get; set; }

        public string? Note { get; set; }

        public ICollection<ProgressShareRecipient> Recipients { get; set; } = new HashSet<ProgressShareRecipient>();
    }

    public class ProgressShareRecipient : BaseEntity
    {
        public int ProgressShareId { get; set; }
        public ProgressShare? ProgressShare { get; set; }

        public int UserId { get; set; }
        public AppUser? User { get; set; }
    }
}
