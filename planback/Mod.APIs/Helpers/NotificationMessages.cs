using Mod.Core.Enums;
using Mod.Core.Utils;

namespace Mod.APIs.Helpers
{
    public static class NotificationMessages
    {
        public static string Build(
            NotificationAction action,
            ModulesNamesOnArabic module,
            string? unitName,
            RoleEnum? actingRole,
            string? planName)
        {
            var moduleName = module.GetDisplayName();

            return action switch
            {
                NotificationAction.Submit =>
                    $"تم إضافة {moduleName} الخاص بوحدة {unitName} من قبل موظفين الوحدة في انتظار مراجعة مدير الوحدة",

                NotificationAction.Approve => actingRole switch
                {
                    RoleEnum.UnitManager => $"تم إرسال مرحلة {moduleName} الخاص بوحدة {unitName}",
                    RoleEnum.RegionManager => $"تمت الموافقة على {moduleName} الخاص بوحدة {unitName} من قبل المدير العام",
                    _ => $"تمت الموافقة على {moduleName} الخاص بوحدة {unitName}"
                },

                NotificationAction.FinalApprove =>
                    $"تمت الموافقة على {moduleName} الخاص بوحدة {unitName} من قبل القيادة العليا",

                NotificationAction.Reject => actingRole switch
                {
                    RoleEnum.UnitManager => $"تم رفض {moduleName} الخاص بوحدة {unitName} من قبل مدير الوحدة",
                    RoleEnum.RegionManager => $"تم رفض {moduleName} الخاص بوحدة {unitName} من قبل المدير العام",
                    RoleEnum.HighManagement => $"تم رفض {moduleName} الخاص بوحدة {unitName} من قبل القيادة العليا",
                    _ => $"تم رفض {moduleName} الخاص بوحدة {unitName}"
                },

                NotificationAction.Return => actingRole switch
                {
                    RoleEnum.UnitManager => $"تمت إعادة {moduleName} الخاص بوحدة {unitName} من قبل مدير الوحدة",
                    RoleEnum.RegionManager => $"تمت إعادة {moduleName} الخاص بوحدة {unitName} من قبل المدير العام",
                    RoleEnum.HighManagement => $"تمت إعادة {moduleName} الخاص بوحدة {unitName} من قبل القيادة العليا",
                    _ => $"تمت إعادة {moduleName} الخاص بوحدة {unitName}"
                },

                NotificationAction.BroadcastPlan =>
                    $"تم إضافة الخطة الاستراتيجية ({planName})",

                // The requester's own wording is carried separately, so these are
                // the standing headline the recipient sees in the bell.
                NotificationAction.FeedbackRequest =>
                    $"مطلوب إبداء المرئيات على {moduleName} الخاص بالخطة ({planName})",

                NotificationAction.FeedbackResponse =>
                    $"تم استلام مرئيات على {moduleName} الخاص بوحدة {unitName}",

                NotificationAction.StageProgress =>
                    $"تم الانتقال إلى مرحلة {moduleName} في الخطة الاستراتيجية ({planName})",

                _ => throw new ArgumentOutOfRangeException(nameof(action), action, null)
            };
        }
    }
}
