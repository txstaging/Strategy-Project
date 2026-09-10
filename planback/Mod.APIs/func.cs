using Mod.Core.Entities.Initiative;
using System;
using static System.Collections.Specialized.BitVector32;

namespace Mod.APIs
{
    public static class func
    {
        public static Func<DirectionItemsElements, bool> GetFilter(RoleEnum role)
        {
            switch (role)
            {
                case RoleEnum.UnitManager:
                    return x => x.Status != ApprovalStatus.All;
                    break;
                case RoleEnum.UnitEmployee:
                    return x => x.Status != ApprovalStatus.All;
                    break;
                case RoleEnum.RegionManager:
                    return p => p.Status == ApprovalStatus.ApprovedByUnitManager || p.Status == ApprovalStatus.ReturnedByRegionManager || p.Status == ApprovalStatus.RejectedByRegionManager || p.Status == ApprovalStatus.ApprovedByRegionManager || p.Status == ApprovalStatus.ApprovedByHighManagement || p.Status == ApprovalStatus.ApprovedByHighManagementPartially || p.Status == ApprovalStatus.ReturnedByHighManagement || p.Status == ApprovalStatus.RejectedByHighManagement || p.Status == ApprovalStatus.ApprovedByRegionManagerPartially;
                    break;
                case RoleEnum.HighManagement:
                    return i => i.Status != ApprovalStatus.Pending && i.Status != ApprovalStatus.RejectedByRegionManager && i.Status != ApprovalStatus.ReturnedByRegionManager && i.Status != ApprovalStatus.ApprovedByRegionManagerPartially && i.Status != ApprovalStatus.ApprovedByUnitManager && i.Status != ApprovalStatus.ApprovedByUnitManagerPartially && i.Status! != ApprovalStatus.ReturnedByUnitManager && i.Status != ApprovalStatus.RejectedByUnitManager;
                    break;
                default:
                    return x => x.Status != ApprovalStatus.ApprovedByUnitManagerPartially && x.Status != ApprovalStatus.Pending && x.Status != ApprovalStatus.RejectedByUnitManager && x.Status != ApprovalStatus.ReturnedByUnitManager || x.Status != ApprovalStatus.ReturnedByRegionManager || x.Status != ApprovalStatus.RejectedByRegionManager;
                    break;
            }

        }
        public static Func<PlanGoals, bool> GetFilterGoal(RoleEnum role)
        {
            switch (role)
            {
                case RoleEnum.UnitManager:
                    return x => x.Status != ApprovalStatus.All&&x.Status!=ApprovalStatus.SavedAsDraft;
                    break;
                case RoleEnum.UnitEmployee:
                    return x => x.Status != ApprovalStatus.All;
                    break;
                case RoleEnum.RegionManager:
                    return p => p.Status == ApprovalStatus.ApprovedByUnitManager || p.Status == ApprovalStatus.ReturnedByRegionManager || p.Status == ApprovalStatus.RejectedByRegionManager || p.Status == ApprovalStatus.ApprovedByRegionManager || p.Status == ApprovalStatus.ApprovedByHighManagement || p.Status == ApprovalStatus.ApprovedByHighManagementPartially || p.Status == ApprovalStatus.ReturnedByHighManagement || p.Status == ApprovalStatus.RejectedByHighManagement || p.Status == ApprovalStatus.ApprovedByRegionManagerPartially;
                    break;
                case RoleEnum.HighManagement:
                    return i => i.Status != ApprovalStatus.Pending && i.Status != ApprovalStatus.RejectedByRegionManager && i.Status != ApprovalStatus.ReturnedByRegionManager && i.Status != ApprovalStatus.ApprovedByRegionManagerPartially && i.Status != ApprovalStatus.ApprovedByUnitManager && i.Status != ApprovalStatus.ApprovedByUnitManagerPartially && i.Status! != ApprovalStatus.ReturnedByUnitManager && i.Status != ApprovalStatus.RejectedByUnitManager;
                    break;
                default:
                    return x => x.Status != ApprovalStatus.ApprovedByUnitManagerPartially && x.Status != ApprovalStatus.Pending && x.Status != ApprovalStatus.RejectedByUnitManager && x.Status != ApprovalStatus.ReturnedByUnitManager || x.Status != ApprovalStatus.ReturnedByRegionManager || x.Status != ApprovalStatus.RejectedByRegionManager;
                    break;
            }

        }
        public static Func<PlanInitiative, bool> GetFilterInitiative(RoleEnum role)
        {
            switch (role)
            {
                case RoleEnum.UnitManager:
                    return x => x.Status != ApprovalStatus.All&&x.Status!=ApprovalStatus.SavedAsDraft;
                    break;
                case RoleEnum.UnitEmployee:
                    return x => x.Status != ApprovalStatus.All;
                    break;
                case RoleEnum.RegionManager:
                    return p => p.Status == ApprovalStatus.ApprovedByUnitManager || p.Status == ApprovalStatus.ReturnedByRegionManager || p.Status == ApprovalStatus.RejectedByRegionManager || p.Status == ApprovalStatus.ApprovedByRegionManager || p.Status == ApprovalStatus.ApprovedByHighManagement || p.Status == ApprovalStatus.ApprovedByHighManagementPartially || p.Status == ApprovalStatus.ReturnedByHighManagement || p.Status == ApprovalStatus.RejectedByHighManagement || p.Status == ApprovalStatus.ApprovedByRegionManagerPartially;
                    break;
                case RoleEnum.HighManagement:
                    return i => i.Status != ApprovalStatus.Pending && i.Status != ApprovalStatus.RejectedByRegionManager && i.Status != ApprovalStatus.ReturnedByRegionManager && i.Status != ApprovalStatus.ApprovedByRegionManagerPartially && i.Status != ApprovalStatus.ApprovedByUnitManager && i.Status != ApprovalStatus.ApprovedByUnitManagerPartially && i.Status! != ApprovalStatus.ReturnedByUnitManager && i.Status != ApprovalStatus.RejectedByUnitManager;
                    break;
                default:
                    return x => x.Status != ApprovalStatus.ApprovedByUnitManagerPartially && x.Status != ApprovalStatus.Pending && x.Status != ApprovalStatus.RejectedByUnitManager && x.Status != ApprovalStatus.ReturnedByUnitManager || x.Status != ApprovalStatus.ReturnedByRegionManager || x.Status != ApprovalStatus.RejectedByRegionManager;
                    break;
            }

        }
        public static Func<InitiativeItem, bool> GetFilterInitiativeItem(RoleEnum role)
        {
            switch (role)
            {
                case RoleEnum.UnitManager:
                    return x => x.Status != ApprovalStatus.All;
                    break;
                case RoleEnum.UnitEmployee:
                    return x => x.Status != ApprovalStatus.All;
                    break;
                case RoleEnum.RegionManager:
                    return p => p.Status == ApprovalStatus.ApprovedByUnitManager || p.Status == ApprovalStatus.ReturnedByRegionManager || p.Status == ApprovalStatus.RejectedByRegionManager || p.Status == ApprovalStatus.ApprovedByRegionManager || p.Status == ApprovalStatus.ApprovedByHighManagement || p.Status == ApprovalStatus.ApprovedByHighManagementPartially || p.Status == ApprovalStatus.ReturnedByHighManagement || p.Status == ApprovalStatus.RejectedByHighManagement || p.Status == ApprovalStatus.ApprovedByRegionManagerPartially;
                    break;
                case RoleEnum.HighManagement:
                    return i => i.Status != ApprovalStatus.Pending && i.Status != ApprovalStatus.RejectedByRegionManager && i.Status != ApprovalStatus.ReturnedByRegionManager && i.Status != ApprovalStatus.ApprovedByRegionManagerPartially && i.Status != ApprovalStatus.ApprovedByUnitManager && i.Status != ApprovalStatus.ApprovedByUnitManagerPartially && i.Status! != ApprovalStatus.ReturnedByUnitManager && i.Status != ApprovalStatus.RejectedByUnitManager;
                    break;
                default:
                    return x => x.Status != ApprovalStatus.ApprovedByUnitManagerPartially && x.Status != ApprovalStatus.Pending && x.Status != ApprovalStatus.RejectedByUnitManager && x.Status != ApprovalStatus.ReturnedByUnitManager || x.Status != ApprovalStatus.ReturnedByRegionManager || x.Status != ApprovalStatus.RejectedByRegionManager;
                    break;
            }

        }
        public static Func<InitiativeKpi, bool> GetFilterInitiativeKpis(RoleEnum role)
        {
            switch (role)
            {
                case RoleEnum.UnitManager:
                    return x => x.Status != ApprovalStatus.All;
                    break;
                case RoleEnum.UnitEmployee:
                    return x => x.Status != ApprovalStatus.All;
                    break;
                case RoleEnum.RegionManager:
                    return p => p.Status == ApprovalStatus.ApprovedByUnitManager || p.Status == ApprovalStatus.ReturnedByRegionManager || p.Status == ApprovalStatus.RejectedByRegionManager || p.Status == ApprovalStatus.ApprovedByRegionManager || p.Status == ApprovalStatus.ApprovedByHighManagement || p.Status == ApprovalStatus.ApprovedByHighManagementPartially || p.Status == ApprovalStatus.ReturnedByHighManagement || p.Status == ApprovalStatus.RejectedByHighManagement || p.Status == ApprovalStatus.ApprovedByRegionManagerPartially;
                    break;
                case RoleEnum.HighManagement:
                    return i => i.Status != ApprovalStatus.Pending && i.Status != ApprovalStatus.RejectedByRegionManager && i.Status != ApprovalStatus.ReturnedByRegionManager && i.Status != ApprovalStatus.ApprovedByRegionManagerPartially && i.Status != ApprovalStatus.ApprovedByUnitManager && i.Status != ApprovalStatus.ApprovedByUnitManagerPartially && i.Status! != ApprovalStatus.ReturnedByUnitManager && i.Status != ApprovalStatus.RejectedByUnitManager;
                    break;
                default:
                    return x => x.Status != ApprovalStatus.ApprovedByUnitManagerPartially && x.Status != ApprovalStatus.Pending && x.Status != ApprovalStatus.RejectedByUnitManager && x.Status != ApprovalStatus.ReturnedByUnitManager || x.Status != ApprovalStatus.ReturnedByRegionManager || x.Status != ApprovalStatus.RejectedByRegionManager;
                    break;
            }

        }
        public static Func<PlanProjects, bool> GetFilterProject(RoleEnum role)
        {
            switch (role)
            {
                case RoleEnum.UnitManager:
                    return x => x.Status != ApprovalStatus.All&&x.Status!=ApprovalStatus.SavedAsDraft;
                    break;
                case RoleEnum.UnitEmployee:
                    return x => x.Status != ApprovalStatus.All;
                    break;
                case RoleEnum.RegionManager:
                    return p => p.Status == ApprovalStatus.ApprovedByUnitManager || p.Status == ApprovalStatus.ReturnedByRegionManager || p.Status == ApprovalStatus.RejectedByRegionManager || p.Status == ApprovalStatus.ApprovedByRegionManager || p.Status == ApprovalStatus.ApprovedByHighManagement || p.Status == ApprovalStatus.ApprovedByHighManagementPartially || p.Status == ApprovalStatus.ReturnedByHighManagement || p.Status == ApprovalStatus.RejectedByHighManagement || p.Status == ApprovalStatus.ApprovedByRegionManagerPartially;
                    break;
                case RoleEnum.HighManagement:
                    return i => i.Status != ApprovalStatus.Pending && i.Status != ApprovalStatus.RejectedByRegionManager && i.Status != ApprovalStatus.ReturnedByRegionManager && i.Status != ApprovalStatus.ApprovedByRegionManagerPartially && i.Status != ApprovalStatus.ApprovedByUnitManager && i.Status != ApprovalStatus.ApprovedByUnitManagerPartially && i.Status! != ApprovalStatus.ReturnedByUnitManager && i.Status != ApprovalStatus.RejectedByUnitManager;
                    break;
                default:
                    return x => x.Status != ApprovalStatus.ApprovedByUnitManagerPartially && x.Status != ApprovalStatus.Pending && x.Status != ApprovalStatus.RejectedByUnitManager && x.Status != ApprovalStatus.ReturnedByUnitManager || x.Status != ApprovalStatus.ReturnedByRegionManager || x.Status != ApprovalStatus.RejectedByRegionManager;
                    break;
            }


        }
    }
}
