using System.ComponentModel.DataAnnotations;

namespace Mod.Core.Enums
{
    public enum ModulesNamesOnArabic
    {
        [Display(Name = "الخطة الأستراتيجية")]
        Plan,

        [Display(Name = "الأهداف")]
        Objectives,

        [Display(Name = "التحليل الأستراتيجى")]
        Analsis,

        [Display(Name = "التوجة الأستراتيجى")]
        Direction,

        [Display(Name = "المبادرات")]
        Init,

        [Display(Name = "المشاريع")]
        Project,

        [Display(Name = "قائمة التحقق للتدقيق الداخلي")]
        InternalAuditCheckList,

        [Display(Name = "سجل المدقق الداخلي")]
        InternalAuditorRecordForm,

        [Display(Name = "برنامج التدقيق الداخلي")]
        InternalAuditProgramModel,

        [Display(Name = "تقرير التدقيق الداخلي")]
        InternalAuditReportForm,

        [Display(Name = "التحقق من الأيزو")]
        Iso,

        [Display(Name = "الدروس المستفادة")]
        LessonsLearnedModel,

        [Display(Name = "القائمة الرئيسية للوثائق")]
        MainListOfDocuments,

        [Display(Name = "سبب اختيار الهدف")]
        ModelTheReasonForChoosingaGoal,

        [Display(Name = "تقرير استبيان رضا المستفيدين")]
        BeneficiarySatisfactionSurveyReport,

        [Display(Name = "تقرير استطلاع رضا المجتمع")]
        CommunitySatisfactionSurveyReport,

        [Display(Name = "تقرير استطلاع رضا الشركاء")]
        PartnerSatisfactionSurveyReport,

        [Display(Name = "تقرير استبيان رضا الموردين")]
        SupplierSatisfactionSurveyReport,

        [Display(Name = "تقرير استطلاع رضا الموظفين")]
        HRSatisfactionSurveyReport,

        [Display(Name = "المساندة")]
        h,

        [Display(Name = "تقرير متابعة الهدف الشهري")]
        MonthlyGoalTrackingReportTemplate,

        [Display(Name = "تسجيل حالة عدم المطابقة")]
        NonConformityRegistrationForm,

        [Display(Name = "نموذج وثائق العمليات")]
        OperationsDocumentTemplate,

        [Display(Name = "حصر العمليات")]
        OperationsInventoryForm,

        [Display(Name = "قائمة توزيع الوثائق الورقية")]
        PaperDocumentsDistributionList,

        [Display(Name = "الخطة والهدف")]
        PlanAndGoalModel,

        [Display(Name = "سياسة الجودة")]
        QualityPolicyModel,

        [Display(Name = "سجل الجرد")]
        RecordInventory,

        [Display(Name = "مؤشرات الأداء")]
        RecordWorkIndicators,

        [Display(Name = "سجل الوثائق الملغاة")]
        RegisterOfCancelledDocuments,

        [Display(Name = "المخاطر والفرص")]
        RisksAndThreatsForms,

        [Display(Name = "مراجعة الإدارة العليا")]
        SeniorMagmentReviewModel,

        [Display(Name = "نماذج جرد المحتويات")]
        TableOfModelsForInventoryingContents
    }
}
