using Mod.Core.Entities;
using Mod.Core.Enums;

namespace Mod.Core.Services.Contract.NotificationService
{
    public interface INotificationService
    {
        Task NotifyAsync(
            NotificationAction action,
            ModulesNamesOnArabic module,
            Units unit,
            FormNameToReturnToFront formName,
            int formId,
            RoleEnum actingRole,
            string? planName = null);

        // Sends to an explicit list of addressees rather than deriving them from
        // the approval chain. A feedback request goes to the units and people the
        // requester picked, which the role-based routing above cannot express.
        Task NotifyRecipientsAsync(
            string message,
            FormNameToReturnToFront formName,
            int formId,
            IEnumerable<int> unitIds,
            IEnumerable<int> userIds);
    }
}
