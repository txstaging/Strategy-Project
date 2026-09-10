using Mod.Core.Entities.Identity;
using Mod.Core.Entities.Initiative;
using Mod.Core.Enums;

namespace Mod.Core.Entities.StrategicPlan
{
    public class PlanProjects:BaseEntity
    {
        public int UnitId { get; set; }
        public Units Units { get; set; } = null!;
        public int PlanId { get; set; }
        public Plans Plan { get; set; }
        public ApprovalStatus Status { get; set; }
        public int? AppUserId { get; set; }
        public AppUser? User { get; set; }
        public int NameId { get; set; }
        public ProjectItems Name { get; set; }
        public int PriorityId { get; set; }
        public ProjectItems Priority { get; set; }
        public int DurationId { get; set; }
        public ProjectItems Duration { get; set; }
        public int BeneficiariesId { get; set; }
        public ProjectItems Beneficiaries { get; set; }
        public int SupervisingAuthorityId { get; set; }
        public ProjectItems SupervisingAuthority { get; set; }
        public ProjectItems Weight { get; set; }
        public int WeightId { get; set; }
        public string Code { get; set; }
        public string? Comment { get; set; }
        public int PlanInitiativeId { get; set; }
        public PlanInitiative Initiative { get; set; }
        public int PlanGoalsId { get; set; }
        public PlanGoals Goals { get; set; }
        public ProjectItems Percentage { get; set; }
        public int PercentageId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        // Approvable wrappers for the dates (nullable so existing rows are unaffected).
        public int? StartDateItemId { get; set; }
        public ProjectItems? StartDateItem { get; set; }
        public int? EndDateItemId { get; set; }
        public ProjectItems? EndDateItem { get; set; }
        public PlanProjectsStep planProjectsStep { get; set; }
        public int planProjectsStepId { get; set; }





    }
}
