using Mod.Core.Enums;

namespace Mod.Core.Utils
{
    public static class Utils
    {
        public static ApprovalStatus GetApprovalStatus(ActionEnum action, RoleEnum role)
        {
            switch (role)
            {
                case RoleEnum.UnitManager:
                    if (action == ActionEnum.Approve) return ApprovalStatus.ApprovedByUnitManagerPartially;
                    if (action == ActionEnum.Reject) return ApprovalStatus.RejectedByUnitManager;
                    if (action == ActionEnum.Return) return ApprovalStatus.ReturnedByUnitManager;
                    break;
                case RoleEnum.UnitEmployee:
                    if (action == ActionEnum.Approve) return ApprovalStatus.SavedAsDraft;
                   
                    break;
                case RoleEnum.RegionManager:
                    if (action == ActionEnum.Approve) return ApprovalStatus.ApprovedByRegionManagerPartially;
                    if (action == ActionEnum.Reject) return ApprovalStatus.RejectedByRegionManager;
                    if (action == ActionEnum.Return) return ApprovalStatus.ReturnedByRegionManager;
                    break;
                case RoleEnum.HighManagement:
                    if (action == ActionEnum.Approve) return ApprovalStatus.ApprovedByHighManagementPartially;
                    if (action == ActionEnum.Reject) return ApprovalStatus.RejectedByHighManagement;
                    if (action == ActionEnum.Return) return ApprovalStatus.ReturnedByHighManagement;
                    break;
            }
            return ApprovalStatus.Pending;
        }
        // True when the item has already been approved by the given role
        // (either the per-item "Partially" state or the full stage state).
        public static bool IsApprovedByRole(ApprovalStatus status, RoleEnum role)
        {
            switch (role)
            {
                case RoleEnum.UnitManager:
                    return status == ApprovalStatus.ApprovedByUnitManager
                        || status == ApprovalStatus.ApprovedByUnitManagerPartially;
                case RoleEnum.RegionManager:
                    return status == ApprovalStatus.ApprovedByRegionManager
                        || status == ApprovalStatus.ApprovedByRegionManagerPartially;
                case RoleEnum.HighManagement:
                    return status == ApprovalStatus.ApprovedByHighManagement
                        || status == ApprovalStatus.ApprovedByHighManagementPartially;
                default:
                    return false;
            }
        }

        // An item blocks stage approval for the acting role when it is neither an
        // unsubmitted draft nor already approved by that role — i.e. it is still
        // pending, returned, rejected, or only approved by a lower level.
        // Drafts (and unset statuses) are excluded: they are not part of the
        // submitted cycle yet.
        public static bool BlocksStageApproval(ApprovalStatus? status, RoleEnum role)
        {
            if (status == null || status == ApprovalStatus.SavedAsDraft) return false;
            return !IsApprovedByRole(status.Value, role);
        }

        // True when the item has been rejected or returned at any level. These are
        // the statuses that must always stop a stage from advancing, regardless of
        // which role is acting. (Whether every item has been *acted upon* is gated
        // by the role-aware frontend, which only shows the submit button when the
        // points in that role's view are all approved.)
        public static bool IsRejectedOrReturned(ApprovalStatus? status)
        {
            return status == ApprovalStatus.RejectedByUnitManager
                || status == ApprovalStatus.RejectedByRegionManager
                || status == ApprovalStatus.RejectedByHighManagement
                || status == ApprovalStatus.ReturnedByUnitManager
                || status == ApprovalStatus.ReturnedByRegionManager
                || status == ApprovalStatus.ReturnedByHighManagement;
        }

        public static ApprovalStatus GetApprovalStatusV2(ActionEnum action, RoleEnum role)
        {
            switch (role)
            {
                case RoleEnum.UnitManager:
                    if (action == ActionEnum.Approve) return ApprovalStatus.ApprovedByUnitManager;
                    if (action == ActionEnum.Reject) return ApprovalStatus.RejectedByUnitManager;
                    if (action == ActionEnum.Return) return ApprovalStatus.ReturnedByUnitManager;
                    break;
                case RoleEnum.RegionManager:
                    if (action == ActionEnum.Approve) return ApprovalStatus.ApprovedByRegionManager;
                    if (action == ActionEnum.Reject) return ApprovalStatus.RejectedByRegionManager;
                    if (action == ActionEnum.Return) return ApprovalStatus.ReturnedByRegionManager;
                    break;
                case RoleEnum.HighManagement:
                    if (action == ActionEnum.Approve) return ApprovalStatus.ApprovedByHighManagement;
                    if (action == ActionEnum.Reject) return ApprovalStatus.RejectedByHighManagement;
                    if (action == ActionEnum.Return) return ApprovalStatus.ReturnedByHighManagement;
                    break;
            }
            return ApprovalStatus.Pending;
        }

    }
}
