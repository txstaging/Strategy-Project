import {
  ApprovalStatusEnum,
  RejectionStatuses,
  ReturnedStatuses,
  RolesEnums,
} from './consts';

// The approval ladder shared by the stage screens: unit manager, then region
// manager, then high management. Each function mirrors one in the backend's
// Utils.cs, and the two sides must stay in step — a mismatch shows up as a
// button the server then refuses, which looks exactly like a workflow bug.

// How far up the ladder a status has been approved: 1 unit manager,
// 2 region manager, 3 high management, 0 for anything not yet approved.
// Utils.ApprovalRank.
export function approvalRank(status: string | null | undefined): number {
  switch (status) {
    case ApprovalStatusEnum.ApprovedByUnitManager:
    case ApprovalStatusEnum.ApprovedByUnitManagerPartially:
      return 1;
    case ApprovalStatusEnum.ApprovedByRegionManager:
    case ApprovalStatusEnum.ApprovedByRegionManagerPartially:
      return 2;
    case ApprovalStatusEnum.ApprovedByHighManagement:
    case ApprovalStatusEnum.ApprovedByHighManagementPartially:
      return 3;
    default:
      return 0;
  }
}

// Utils.RoleRank.
export function roleRank(role: string | null | undefined): number {
  switch (role) {
    case RolesEnums.UnitManager:
      return 1;
    case RolesEnums.RegionManager:
      return 2;
    case RolesEnums.HighManagement:
      return 3;
    default:
      return 0;
  }
}

// Rejected or returned at any level. Utils.IsRejectedOrReturned.
export function isSentBack(status: string | null | undefined): boolean {
  return (
    RejectionStatuses.includes(status as ApprovalStatusEnum) ||
    ReturnedStatuses.includes(status as ApprovalStatusEnum)
  );
}

// The per-item "Partially" status the given role writes when it ticks a single
// item, before pressing send. Utils.IsPartialOf.
export function isPartialOf(
  status: string | null | undefined,
  role: string | null | undefined
): boolean {
  switch (roleRank(role)) {
    case 1:
      return status === ApprovalStatusEnum.ApprovedByUnitManagerPartially;
    case 2:
      return status === ApprovalStatusEnum.ApprovedByRegionManagerPartially;
    case 3:
      return status === ApprovalStatusEnum.ApprovedByHighManagementPartially;
    default:
      return false;
  }
}

// Whether the stage is currently waiting on this role: the level below has
// pressed send, and this role has not sent it on yet. Utils.IsStageWith.
export function isStageWith(
  stageStatus: string | null | undefined,
  role: string | null | undefined
): boolean {
  const rank = roleRank(role);
  return rank > 0 && approvalRank(stageStatus) === rank - 1;
}

// Whether a role may approve, reject or return an element at this status.
// Utils.CanRoleActInStage.
//
// A role acts on anything still below its level while the stage is with it.
// Anything already approved at its level or above needs nothing more from it —
// that is what keeps approvals earned higher up from reopening when another
// element is returned and the stage goes back to the unit manager.
export function canRoleActInStage(
  status: string | null | undefined,
  stageStatus: string | null | undefined,
  role: string | null | undefined
): boolean {
  if (!status || status === ApprovalStatusEnum.SavedAsDraft) return false;
  // Screens sometimes write placeholders such as 'Approved' right after a click,
  // until the fresh data arrives; those are never actionable.
  if (!Object.values(ApprovalStatusEnum).includes(status as ApprovalStatusEnum)) {
    return false;
  }
  if (isSentBack(status)) return false;
  if (approvalRank(status) >= roleRank(role)) return false;
  return isStageWith(stageStatus, role);
}

// Whether an element still stands between this role and approving the thing
// that contains it (or sending the stage): not yet approved at this level or
// above. Unset and draft statuses never block. Utils.BlocksStageApproval.
export function blocksApproval(
  status: string | null | undefined,
  role: string | null | undefined
): boolean {
  if (!status || status === ApprovalStatusEnum.SavedAsDraft) return false;
  return approvalRank(status) < roleRank(role);
}
