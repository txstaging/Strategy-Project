using Mod.Core.Entities.Identity;
using Mod.Core.Entities.StrategicPlan;

namespace Mod.Core.Entities
{
    // How the contact was made. Persisted as an integer, so pinned.
    public enum CommunicationMethod
    {
        Phone = 0,      // تليفون
        Email = 1,      // بريد إلكتروني
        Interview = 2,  // مقابلة
        Meeting = 3,    // اجتماع
    }

    // «خطة التواصل والمجازفات» — checklist item 21. One row of the sheet kept
    // under the reports stage: who was contacted, how, by whom, and what was
    // done about it. Sending the sheet to someone for their views reuses
    // FeedbackRequest with the communication subject.
    public class CommunicationPlanEntry : BaseEntity
    {
        public int PlanId { get; set; }
        public Plans? Plan { get; set; }

        public DateTime Date { get; set; }

        // قناة التواصل — the party or channel contacted.
        public string Channel { get; set; } = null!;

        // طريقة التواصل
        public CommunicationMethod Method { get; set; }

        // الضابط المسؤول
        public string ResponsibleOfficer { get; set; } = null!;

        // الإجراء المتخذ
        public string ActionTaken { get; set; } = null!;

        public int CreatedByUserId { get; set; }
        public AppUser? CreatedByUser { get; set; }

        public int? UnitId { get; set; }
        public Units? Unit { get; set; }
    }
}
