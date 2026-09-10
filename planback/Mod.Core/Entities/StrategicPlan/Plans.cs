namespace Mod.Core.Entities.StrategicPlan
{
    public class Plans : BaseEntity
    {
        public string Name { get; set; }
        public int UnitId { get; set; }
        public Units Units { get; set; } = null!;
        public int? MasterPlanId { get; set; }
        public PlanMaster? PlanMaster { get; set; }
        public ApprovalStatus Status { get; set; }
        public int? PlanAnalysisId { get; set; }
        public PlanAnalysis? PlanAnalysis { get; set; }
        public int? PlanDirectionId { get; set; }
        public PlanDirection? PlanDirection { get; set; }
        public int? PlanGoalsStepId { get; set; }
        public PlanGoalsStep? PlanGoalsStep { get; set; } = null!;
        public PlanInitiativeStep? PlanInitiativeStep { get; set; } = null!;
        public int? planInitiativeStepId { get; set; }


       public PlanProjectsStep? PlanProjectsStep { get; set; } = null!;
        public int? planProjectsStepId { get; set; }
        public StrategicPlanLevels CurrentStage { get; set; } = StrategicPlanLevels.AnalysisStage;
    }
}
