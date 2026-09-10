using System.ComponentModel.DataAnnotations;

namespace Mod.APIs.Helpers
{
    public static class AuthConstants
    {
        public static class Roles
        {
            public static string Admin = "Admin";
            public static string HighManagement = "HighManagement";
            public static string RegionManager = "RegionManager";
            public static string UnitManager = "UnitManager";
            public static string UnitEmployee = "UnitEmployee";
        }
        public static class Modules
        {
            public const string Plans = "Plans";
            public const string Goals = "Goals";
            public const string Analysis = "Analysis";
            public const string Reports = "Reports";
            public const string Projects = "Projects";
            public const string Initiative = "Initiative";
            public const string Direction= "Direction";
        }

        public static class Permissions
        {
            public const string Approve = "Approve";
            public const string Reject = "Reject";
            public const string Return = "Return";

            public const string Add = "Add";
            public const string Update = "Update";
            public const string Delete = "Delete";
            public const string GetAll = "GetAll";
            public const string GetOne = "GetOne";
        }
    }

}
