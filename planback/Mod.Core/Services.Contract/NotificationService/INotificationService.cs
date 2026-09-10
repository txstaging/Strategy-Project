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
    }
}
