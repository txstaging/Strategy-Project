using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Mod.Core.Entities;
using Mod.Core.Entities.StrategicPlan;

namespace Mod.Core.DTOs.Report
{
    public class GetAllDataDto : BaseEntity
    {
        public int UnitId { get; set; }
        public string UnitName { get; set; }
        public decimal UnitPercentage { get; set; }
        public int GoalId { get; set; }
        public decimal GoalPercentage { get; set; }
        public int InitiativeId { get; set; }
        public decimal InitiativePercentage { get; set; }
        public int ProjectId { get; set; }
        public int PlanId { get; set; }
        public decimal ProjectPercentage { get; set; }

        [NotMapped]
        public int Id { get; set; }
        [NotMapped]
        public bool? IsDeleted { get; set; } = false;
        [NotMapped]
        public DateTime? DeletedAt { get; set; }
        [NotMapped]
        public DateTime? UpdatedAt { get; set; }
        [NotMapped]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    }

    public class UnitReport
    {
        public int UnitId { get; set; }
        public string UnitName { get; set; }
        public double? UnitPercentage { get; set; }
        public List<GoalReport> Goals { get; set; } = new List<GoalReport>();
    }

    public class GoalReport
    {
        public int GoalId { get; set; }
        public string GoalName { get; set; }
        public double? GoalPercentage { get; set; }
        public List<InitiativeReport> Initiatives { get; set; } = new List<InitiativeReport>();
        public  TimeLine? TimeLine { get; set; }    
    }
    public enum TimeLine
    {
       
        Completed=1
        
    }

    public class InitiativeReport
    {
        public int InitiativeId { get; set; }
        public string InitiativeName { get; set; }
        public double? InitiativePercentage { get; set; }
        public List<ProjectReport> Projects { get; set; } = new List<ProjectReport>();
        public TimeLine? TimeLine { get; set; }
    }

    public class ProjectReport
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; }
        public double? Percentage { get; set; }
        public string? PercentageStatus { get; set; }
        public string? PercentageComment { get; set; }
        public string? PercentageFilePath { get; set; }
        public int? PercentageItemId { get; set; }
        public string Priority { get; set; }
        public string StartDate { get; set; }
        public string EndDate { get; set; }
        public string? Code {  get; set; }
        public TimeLine? TimeLine { get; set; }

    }
}
