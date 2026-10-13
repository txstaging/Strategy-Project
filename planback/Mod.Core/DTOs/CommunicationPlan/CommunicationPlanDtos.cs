using System.Text.Json.Serialization;
using Mod.Core.Entities;

namespace Mod.Core.DTOs.CommunicationPlan
{
    public class CommunicationPlanEntryDto
    {
        public int Id { get; set; }
        public int PlanId { get; set; }
        public DateTime Date { get; set; }
        public string Channel { get; set; } = null!;

        // As a number, matching the Angular enum; the global string converter
        // would otherwise send "Phone" and the dropdown would not match.
        [JsonConverter(typeof(JsonNumberEnumConverter<CommunicationMethod>))]
        public CommunicationMethod Method { get; set; }

        public string ResponsibleOfficer { get; set; } = null!;
        public string ActionTaken { get; set; } = null!;
        public string? CreatedByName { get; set; }
        public string? UnitName { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class SaveCommunicationPlanEntryDto
    {
        public int PlanId { get; set; }
        public DateTime Date { get; set; }
        public string Channel { get; set; } = null!;

        [JsonConverter(typeof(JsonNumberEnumConverter<CommunicationMethod>))]
        public CommunicationMethod Method { get; set; }

        public string ResponsibleOfficer { get; set; } = null!;
        public string ActionTaken { get; set; } = null!;
    }
}
