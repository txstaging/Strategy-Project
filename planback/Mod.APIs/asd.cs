namespace Mod.APIs
{
    public static class ModulePermissions
    {
        public static readonly Dictionary<string, List<string>> PermissionsByModule = new()
    {
        { Modules.Plans, new List<string> { Permissions.Approve, Permissions.Reject, Permissions.Return, Permissions.Add, Permissions.Update, Permissions.Delete, Permissions.GetAll, Permissions.GetOne } },
        { Modules.Goals, new List<string> { Permissions.Approve, Permissions.Reject, Permissions.Return, Permissions.Add, Permissions.Update, Permissions.Delete, Permissions.GetAll, Permissions.GetOne } },
        { Modules.Analysis, new List<string> { Permissions.Approve, Permissions.Reject, Permissions.Return, Permissions.Add, Permissions.Update, Permissions.Delete, Permissions.GetAll, Permissions.GetOne } },
        { Modules.Reports, new List<string> { Permissions.Approve, Permissions.Reject, Permissions.Return, Permissions.Add, Permissions.Update, Permissions.Delete, Permissions.GetAll, Permissions.GetOne } },
        { Modules.Projects, new List<string> { Permissions.Approve, Permissions.Reject, Permissions.Return, Permissions.Add, Permissions.Update, Permissions.Delete, Permissions.GetAll, Permissions.GetOne } },
        { Modules.Initiative, new List<string> { Permissions.Approve, Permissions.Reject, Permissions.Return, Permissions.Add, Permissions.Update, Permissions.Delete, Permissions.GetAll, Permissions.GetOne } },
        { Modules.Direction, new List<string> { Permissions.Approve, Permissions.Reject, Permissions.Return, Permissions.Add, Permissions.Update, Permissions.Delete, Permissions.GetAll, Permissions.GetOne } }
    };

        // إرجاع كل الوحدات مع جميع الصلاحيات الخاصة بها
        public static Dictionary<string, List<string>> GetAllPermissions()
        {
            return PermissionsByModule;
        }
    }

}
