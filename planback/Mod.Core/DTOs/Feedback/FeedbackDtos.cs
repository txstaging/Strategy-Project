using Mod.Core.Entities;

namespace Mod.Core.DTOs.Feedback
{
    public class CreateFeedbackRequestDto
    {
        public int PlanId { get; set; }
        public string Message { get; set; } = null!;

        // Which part of the plan the views are wanted on.
        public FormNameToReturnToFront Subject { get; set; }

        // Optional id of one item inside that stage.
        public int? SubjectId { get; set; }

        public DateTime? DueDate { get; set; }

        // «تحديد وحدات معيّنة» and «من يتم اختيارهم». At least one must be given.
        public List<int> UnitIds { get; set; } = new();
        public List<int> UserIds { get; set; } = new();
    }

    public class AddFeedbackResponseDto
    {
        public string Message { get; set; } = null!;
    }

    public class FeedbackRecipientDto
    {
        public int? UnitId { get; set; }
        public string? UnitName { get; set; }
        public int? UserId { get; set; }
        public string? UserName { get; set; }
        public bool HasResponded { get; set; }
    }

    public class FeedbackResponseDto
    {
        public int Id { get; set; }
        public string Message { get; set; } = null!;
        public int RespondedByUserId { get; set; }
        public string? RespondedByName { get; set; }
        public string? UnitName { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class FeedbackRequestDto
    {
        public int Id { get; set; }
        public string Message { get; set; } = null!;
        public int PlanId { get; set; }
        public string? PlanName { get; set; }
        public string Subject { get; set; } = null!;
        public int? SubjectId { get; set; }
        // Name of the specific item, when the request is about one.
        public string? SubjectName { get; set; }
        public DateTime? DueDate { get; set; }
        public bool IsClosed { get; set; }
        public DateTime? CreatedAt { get; set; }

        public int RequestedByUserId { get; set; }
        public string? RequestedByName { get; set; }

        // True when the caller is the one who asked, which decides whether the
        // screen shows a reply box or the collected answers.
        public bool IsMine { get; set; }
        public int ResponseCount { get; set; }

        public List<FeedbackRecipientDto> Recipients { get; set; } = new();
        public List<FeedbackResponseDto> Responses { get; set; } = new();
    }
}
