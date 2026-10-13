using System.Text.Json.Serialization;
using Mod.Core.Entities;

namespace Mod.Core.DTOs.ProjectAllocation
{
    public class AllocationDto
    {
        public int Id { get; set; }

        [JsonConverter(typeof(JsonNumberEnumConverter<AllocationKind>))]
        public AllocationKind Kind { get; set; }

        public string Name { get; set; } = null!;
        public decimal? Amount { get; set; }
        public string? Notes { get; set; }
    }

    public class SaveAllocationDto
    {
        public int ProjectId { get; set; }

        [JsonConverter(typeof(JsonNumberEnumConverter<AllocationKind>))]
        public AllocationKind Kind { get; set; }

        public string Name { get; set; } = null!;
        public decimal? Amount { get; set; }
        public string? Notes { get; set; }
    }

    // One row of the screen: a project with everything allocated to it.
    public class ProjectAllocationsDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = null!;
        public string? Code { get; set; }
        public int UnitId { get; set; }
        public string? UnitName { get; set; }
        public int PlanId { get; set; }
        public string? PlanName { get; set; }
        public double? Percentage { get; set; }

        public List<AllocationDto> Resources { get; set; } = new();
        public List<AllocationDto> Budgets { get; set; } = new();
        public List<AllocationDto> Contracts { get; set; } = new();

        public decimal BudgetTotal { get; set; }
        public decimal ContractTotal { get; set; }
    }
}
