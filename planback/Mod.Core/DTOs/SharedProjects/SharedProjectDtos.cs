using System.Text.Json.Serialization;
using Mod.Core.Entities;

namespace Mod.Core.DTOs.SharedProjects
{
    public class ParticipantDto
    {
        public int Id { get; set; }
        public int? UnitId { get; set; }
        public string? UnitName { get; set; }
        public string? PartyName { get; set; }

        // The participant as shown: the unit's name, or the free-text party.
        public string DisplayName { get; set; } = null!;

        [JsonConverter(typeof(JsonNumberEnumConverter<ContributionType>))]
        public ContributionType ContributionType { get; set; }

        public string Contribution { get; set; } = null!;
        public decimal? Amount { get; set; }

        [JsonConverter(typeof(JsonNumberEnumConverter<ContributionStatus>))]
        public ContributionStatus Status { get; set; }

        public string? Notes { get; set; }
    }

    public class SaveParticipantDto
    {
        public int ProjectId { get; set; }
        public int? UnitId { get; set; }
        public string? PartyName { get; set; }

        [JsonConverter(typeof(JsonNumberEnumConverter<ContributionType>))]
        public ContributionType ContributionType { get; set; }

        public string Contribution { get; set; } = null!;
        public decimal? Amount { get; set; }

        [JsonConverter(typeof(JsonNumberEnumConverter<ContributionStatus>))]
        public ContributionStatus Status { get; set; }

        public string? Notes { get; set; }
    }

    // One row of the screen: a project with everyone taking part in it.
    public class SharedProjectDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = null!;
        public string? Code { get; set; }
        public int UnitId { get; set; }
        public string? UnitName { get; set; }
        public int PlanId { get; set; }
        public string? PlanName { get; set; }
        public double? Percentage { get; set; }
        public List<ParticipantDto> Participants { get; set; } = new();
    }
}
