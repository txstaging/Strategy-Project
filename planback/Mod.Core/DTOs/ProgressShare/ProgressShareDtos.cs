using System.Text.Json.Serialization;
using Mod.Core.Entities;

namespace Mod.Core.DTOs.ProgressShare
{
    public class CreateProgressShareDto
    {
        public ProgressScope Scope { get; set; }
        public int ScopeId { get; set; }
        public string? Note { get; set; }
        public List<int> UserIds { get; set; } = new();
    }

    // One thing that can be shared, with its current figure, for the picker.
    public class ProgressOptionDto
    {
        // As a number, matching the Angular ProgressScope enum. The global
        // JsonStringEnumConverter would otherwise send "Project" and the
        // client's numeric comparisons would never match.
        [JsonConverter(typeof(JsonNumberEnumConverter<ProgressScope>))]
        public ProgressScope Scope { get; set; }
        public int ScopeId { get; set; }
        public string Name { get; set; } = null!;
        public double Percentage { get; set; }
        public string? UnitName { get; set; }
        public int? PlanId { get; set; }
    }

    public class ProgressShareRecipientDto
    {
        public int UserId { get; set; }
        public string? UserName { get; set; }
        public string? UnitName { get; set; }
    }

    public class ProgressShareDto
    {
        public int Id { get; set; }
        public string Scope { get; set; } = null!;
        public int ScopeId { get; set; }
        public string ScopeName { get; set; } = null!;

        // The figure at the moment it was shared.
        public double Percentage { get; set; }

        // The figure right now, so the recipient can see whether it has moved.
        public double? LivePercentage { get; set; }

        public int? PlanId { get; set; }
        public string? Note { get; set; }
        public DateTime? CreatedAt { get; set; }

        public int SentByUserId { get; set; }
        public string? SentByName { get; set; }
        public bool IsMine { get; set; }

        public List<ProgressShareRecipientDto> Recipients { get; set; } = new();
    }
}
