using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Mod.Core.Entities
{
    public class Notification : BaseEntity
    {
        public string Message { get; set; }


        public bool IsRead { get; set; } = false;
        public virtual ICollection<NotificationRolesTarget> NotificationRolesTargets { get; set; } = new HashSet<NotificationRolesTarget>();
        public int FormId { get; set; }
        public FormNameToReturnToFront FormNameToReturnToFront { get; set; }

    }
    public class NotificationRolesTarget : BaseEntity
    {
        public string Role { get; set; }
        public virtual Units? Unit { get; set; }
        public int? UnitId { get; set; }
    }





    public enum FormNameToReturnToFront
    {
        [Display(Name = "plans")]
        plans,

        [Display(Name = "analysis-stage")]
        analysisstage,

        [Display(Name = "direction-stage")]
        directionstage,

        [Display(Name = "document-amendment-request")]
        Goals,

        [Display(Name = "external-documents-inventory")]
        init,

        [Display(Name = "goal-classification")]
        project,

        [Display(Name = "internal-audit-check-list")]
        InternalAuditCheckList,

        [Display(Name = "Internal-auditor")]
        InternalAuditorRecordForm,

        [Display(Name = "internal-audit-program-model")]
        InternalAuditProgramModel,

        [Display(Name = "internal-audit-report")]
        InternalAuditReportForm,

        [Display(Name = "Iso")]
        Iso,

        [Display(Name = "lessons-learned")]
        LessonsLearnedModel,

        [Display(Name = "main-list-of-documents")]
        MainListOfDocuments,

        [Display(Name = "model-the-resson-for-choosinga-goal")]
        ModelTheReasonForChoosingaGoal,

        [Display(Name = "monitoring-measurement/form/1")]
        BeneficiarySatisfactionSurveyReport,

        [Display(Name = "monitoring-measurement/form/2")]
        CommunitySatisfactionSurveyReport,

        [Display(Name = "monitoring-measurement/form/3")]
        PartnerSatisfactionSurveyReport,

        [Display(Name = "monitoring-measurement/form/4")]
        SupplierSatisfactionSurveyReport,

        [Display(Name = "monitoring-measurement/form/5")]
        HRSatisfactionSurveyReport,

        [Display(Name = "supporting-documents")]
        h,

        [Display(Name = "monthly-goal-tracking-report")]
        MonthlyGoalTrackingReportTemplate,

        [Display(Name = "non-conformity")]
        NonConformityRegistrationForm,

        [Display(Name = "operation-document-template")]
        OperationsDocumentTemplate,

        [Display(Name = "operations-inventory")]
        OperationsInventoryForm,

        [Display(Name = "paper-documents-distribution-list")]
        PaperDocumentsDistributionList,

        [Display(Name = "plan-and-goal")]
        PlanAndGoalModel,

        [Display(Name = "quality-policy")]
        QualityPolicyModel,

        [Display(Name = "inventory-records")]
        RecordInventory,

        [Display(Name = "work-indicators")]
        RecordWorkIndicators,

        [Display(Name = "canceled-documents")]
        RegisterOfCancelledDocuments,

        [Display(Name = "risks-opportunities")]
        RisksAndThreatsForms,

        [Display(Name = "senior-mangment-review")]
        SeniorMagmentReviewModel,

        [Display(Name = "table-of-models-for-inventorying")]
        TableOfModelsForInventoryingContents
    }
}
