using Mod.Core.Entities.Identity;
using Mod.Core.Entities.StrategicPlan;

namespace Mod.Core.Entities
{
    // «طلب مرئيات» — a platform official asking chosen units or people for their
    // views on part of a strategic plan: a stage, a form, a report, a project or
    // an initiative. Recipients answer with a FeedbackResponse, and both the
    // request and each answer are delivered through the normal notification list.
    public class FeedbackRequest : BaseEntity
    {
        public string Message { get; set; } = null!;

        public int RequestedByUserId { get; set; }
        public AppUser? RequestedByUser { get; set; }

        public int PlanId { get; set; }
        public Plans? Plan { get; set; }

        // What the request is about. Reuses the notification form-name vocabulary
        // so the subject and its deep link stay one concept rather than two.
        public FormNameToReturnToFront Subject { get; set; }

        // Optional id of the specific item within that stage, so a request can be
        // about one project or initiative rather than the whole stage.
        public int? SubjectId { get; set; }

        public DateTime? DueDate { get; set; }

        // Closed by the requester once they have what they need. Kept rather than
        // deleted, so the answers stay on record.
        public bool IsClosed { get; set; }

        public ICollection<FeedbackRequestRecipient> Recipients { get; set; } = new HashSet<FeedbackRequestRecipient>();
        public ICollection<FeedbackResponse> Responses { get; set; } = new HashSet<FeedbackResponse>();
    }

    // One addressee of a request. Either a whole unit or one named person, never
    // both: UnitId is set for «تحديد وحدات معيّنة», UserId for «من يتم اختيارهم».
    public class FeedbackRequestRecipient : BaseEntity
    {
        public int FeedbackRequestId { get; set; }
        public FeedbackRequest? FeedbackRequest { get; set; }

        public int? UnitId { get; set; }
        public Units? Unit { get; set; }

        public int? UserId { get; set; }
        public AppUser? User { get; set; }
    }

    // «المرئيات» — an answer to a request. A recipient may add more than one.
    public class FeedbackResponse : BaseEntity
    {
        public int FeedbackRequestId { get; set; }
        public FeedbackRequest? FeedbackRequest { get; set; }

        public int RespondedByUserId { get; set; }
        public AppUser? RespondedByUser { get; set; }

        public int? UnitId { get; set; }
        public Units? Unit { get; set; }

        public string Message { get; set; } = null!;
    }
}
