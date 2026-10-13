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

        // How far up the ladder a status has been approved: 1 unit manager,
        // 2 region manager, 3 high management, 0 for anything not yet approved.
        // The full and the "Partially" form of a level count the same here.
        public static int ApprovalRank(ApprovalStatus? status) => status switch
        {
            ApprovalStatus.ApprovedByUnitManager or ApprovalStatus.ApprovedByUnitManagerPartially => 1,
            ApprovalStatus.ApprovedByRegionManager or ApprovalStatus.ApprovedByRegionManagerPartially => 2,
            ApprovalStatus.ApprovedByHighManagement or ApprovalStatus.ApprovedByHighManagementPartially => 3,
            _ => 0,
        };

        public static int RoleRank(RoleEnum role) => role switch
        {
            RoleEnum.UnitManager => 1,
            RoleEnum.RegionManager => 2,
            RoleEnum.HighManagement => 3,
            _ => 0,
        };

        // An item blocks stage approval for the acting role while it sits below
        // that role's level — still pending, returned, rejected, or approved only
        // further down. Drafts and unset statuses are not part of the submitted
        // cycle and never block.
        //
        // Something already approved *above* the acting role does not block
        // either. That only happens in data left inconsistent by the old
        // out-of-order approvals, and refusing there would tell a manager an item
        // "has not been acted on" when in fact it had been acted on twice.
        public static bool BlocksStageApproval(ApprovalStatus? status, RoleEnum role)
        {
            if (status == null || status == ApprovalStatus.SavedAsDraft) return false;
            return ApprovalRank(status) < RoleRank(role);
        }

        // The per-item "Partially" status the given role writes when it ticks a
        // single item, before pressing send.
        public static bool IsPartialOf(ApprovalStatus? status, RoleEnum role) => role switch
        {
            RoleEnum.UnitManager => status == ApprovalStatus.ApprovedByUnitManagerPartially,
            RoleEnum.RegionManager => status == ApprovalStatus.ApprovedByRegionManagerPartially,
            RoleEnum.HighManagement => status == ApprovalStatus.ApprovedByHighManagementPartially,
            _ => false,
        };

        // Whether pressing send would hand anything on.
        //
        // Either the stage has not reached this role yet, or this role has ticked
        // items that are still waiting to be sent. The second half matters when
        // the stage status is ahead of the items — one element was reworked after
        // the stage had gone up — because the role that re-approved the element
        // must still be able to send it, or it sits there for good.
        //
        // Anything else is a second press on a stage already sent, which used to
        // rewrite the stage status and pull it back down a level.
        public static bool HasSomethingToSend(ApprovalStatus? stageStatus, IEnumerable<ApprovalStatus?> statuses, RoleEnum role)
        {
            return ApprovalRank(stageStatus) < RoleRank(role)
                || statuses.Any(s => IsPartialOf(s, role));
        }

        // Whether a role may act on an item at its current status.
        //
        // The ladder is unit manager, then region manager, then high management,
        // and a role may only act once the level below has finished. "Finished"
        // means the full approved status, which is written when someone presses
        // the stage send button — not the "Partially" status a single item gets
        // when it is approved on its own. Accepting "Partially" was what made the
        // work appear to travel upward by itself: the next manager's buttons lit
        // up as soon as the last item was ticked, before anyone pressed send.
        public static bool CanRoleActOn(ApprovalStatus? status, RoleEnum role)
        {
            if (status == null || status == ApprovalStatus.SavedAsDraft) return false;

            // An item sent back has to be edited before anyone reviews it again.
            if (IsRejectedOrReturned(status)) return false;

            // Already handled at this level; there is nothing left to do.
            if (IsApprovedByRole(status.Value, role)) return false;

            return role switch
            {
                RoleEnum.UnitManager => status == ApprovalStatus.Pending,
                RoleEnum.RegionManager => status == ApprovalStatus.ApprovedByUnitManager,
                RoleEnum.HighManagement => status == ApprovalStatus.ApprovedByRegionManager,
                _ => false,
            };
        }

        // Whether the stage is currently waiting on this role: the level below has
        // pressed send (for the unit manager, the employee has submitted), and
        // this role has not sent it on yet.
        public static bool IsStageWith(ApprovalStatus? stageStatus, RoleEnum role)
        {
            var rank = RoleRank(role);
            return rank > 0 && ApprovalRank(stageStatus) == rank - 1;
        }

        // Whether a role may act on a goal, or on one of its items, in the goals
        // stage.
        //
        // Goals cannot use CanRoleActOn. When one item of a goal is returned and
        // reworked, the goal goes back to the unit manager but its other items
        // keep the approvals they already earned, so a goal routinely has items
        // sitting at different rungs. CanRoleActOn asks for the exact status of
        // the level below, which those items never have, and the frontend asked
        // for the acting role's own status on every item — so the unit manager
        // could neither approve the goal nor its items, never saw the send button,
        // and the stage never reached high management's final approval.
        //
        // The rule here reads the rung from the stage instead: a role acts on
        // anything still below its level while the stage is with it, and
        // anything already at or above its level needs nothing more from it.
        // objectives-status.service.ts implements the same rule and the two must
        // stay in step.
        public static bool CanRoleActInStage(ApprovalStatus? status, ApprovalStatus? stageStatus, RoleEnum role)
        {
            if (status == null || status == ApprovalStatus.SavedAsDraft) return false;

            // An item sent back has to be edited before anyone reviews it again.
            if (IsRejectedOrReturned(status)) return false;

            // Already approved at this level or above.
            if (ApprovalRank(status) >= RoleRank(role)) return false;

            return IsStageWith(stageStatus, role);
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

        // Which items a role may see in a stage listing.
        //
        // The rule is deliberately simple: everyone above the unit employee sees the
        // whole approval chain except the employee's unsubmitted drafts. An item that
        // is rejected or returned at a lower level still blocks stage approval, so the
        // role that has to clear the stage must be able to see it. Hiding those items
        // was what left plans permanently stuck, with a manager told the stage could
        // not be approved and no way to find the item responsible.
        //
        // Visibility is not permission to act. Whether a role may approve, reject,
        // return or delete a given item is decided separately by the module policies
        // and by the status rules in the Angular components.
        public static bool IsVisibleTo(ApprovalStatus? status, RoleEnum role)
        {
            // "All" is a query sentinel rather than a real state an item can hold.
            if (status == ApprovalStatus.All) return false;

            // Legacy rows predating the status column are left visible to everyone,
            // which is how the previous per-entity filters behaved.
            if (status == null) return true;

            return role switch
            {
                // The employee owns the content of their unit, drafts included.
                RoleEnum.UnitEmployee => true,

                // An operator account, outside the approval chain.
                RoleEnum.Admin => true,

                // Everyone in the chain sees everything that has been submitted.
                _ => status != ApprovalStatus.SavedAsDraft,
            };
        }

        // Whether an item may still be removed from its stage.
        //
        // Anything that has not been approved at some level is still in flux: a
        // draft, an item awaiting review, or one sent back by any level. Once a
        // level has approved it, it is part of the agreed plan and stays.
        //
        // This is the "what", not the "who" — who may delete is the module's
        // Delete permission, enforced by the policy on the endpoint.
        public static bool IsDeletable(ApprovalStatus? status)
        {
            if (status == null) return true;

            return status == ApprovalStatus.Pending
                || status == ApprovalStatus.SavedAsDraft
                || IsRejectedOrReturned(status);
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
