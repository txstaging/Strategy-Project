namespace Mod.Core.Enums
{
    public enum NotificationAction
    {
        Submit,
        Approve,
        FinalApprove,
        Reject,
        Return,
        BroadcastPlan,

        // «طلب مرئيات» and its answer.
        FeedbackRequest,
        FeedbackResponse,

        // The plan moved on to the next stage.
        StageProgress
    }
}
