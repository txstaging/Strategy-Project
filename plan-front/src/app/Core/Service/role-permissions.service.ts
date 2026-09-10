import { Injectable } from '@angular/core';
import {
  ApprovalStatusEnum,
  RolesEnums,
  ReturnedStatuses,
  RejectionStatuses,
  PendingStatuses,
  FinishedByRegionManager,
  FinishedByHighManagement,
} from '../utilities/consts';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RolePermissionsService {
  constructor(private authService: AuthService) {}

  /**
   * Check if the current user can add new items
   * Only unit employees can add new items
   */
  canAddItems(): boolean {
    const userRole = this.authService.getUserRole();
    return userRole === RolesEnums.UnitEmployee;
  }

  /**
   * Check if the current user can edit an item
   * Unit employees can edit:
   * - Items that are in Pending status
   * - Items that have been returned or rejected
   * @param item The item to check
   */
  canEditItem(item: any): boolean {
    const userRole = this.authService.getUserRole();

    // Only unit employees can edit
    if (userRole !== RolesEnums.UnitEmployee) return false;

    // Check if item is in a valid status for editing
    const isReturned = ReturnedStatuses.includes(item.status);
    const isRejected = RejectionStatuses.includes(item.status);
    const isPending = PendingStatuses.includes(item.status);

    // Employee can edit if:
    // 1. Item is in pending status, OR
    // 2. Item has been returned or rejected
    return isPending || isReturned || isRejected;
  }

  /**
   * Check if the current user can approve the whole stage
   * Unit Managers, Region Managers, and High Management can approve whole stages
   * @param status Current status of the stage
   */
  canApproveWholeStage(status: ApprovalStatusEnum): boolean {
    const userRole = this.authService.getUserRole();

    // Unit Manager can approve if status is Pending or ReturnedByRegionManager
    if (userRole === RolesEnums.UnitManager) {
      const result =
        status === ApprovalStatusEnum.Pending ||
        status === ApprovalStatusEnum.ReturnedByRegionManager ||
        status === ApprovalStatusEnum.ReturnedByHighManagement;
      return result;
    }

    // Region Manager can approve if approved by Unit Manager but not by Region Manager
    if (userRole === RolesEnums.RegionManager) {
      const result =
        status === ApprovalStatusEnum.ApprovedByUnitManager ||
        status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
        status === ApprovalStatusEnum.ReturnedByHighManagement;
      return result;
    }

    // High Management can approve if approved by Region Manager but not by High Management
    if (userRole === RolesEnums.HighManagement) {
      const result =
        status === ApprovalStatusEnum.ApprovedByRegionManager ||
        status === ApprovalStatusEnum.ApprovedByRegionManagerPartially;
      return result;
    }

    return false;
  }

  /**
   * Check if the current user can take action (approve/reject/return) on an individual item
   * Region Managers and High Management can take actions on individual items
   * Unit Managers can only approve, not reject or return
   * @param item The item to check
   * @param action The action to check (approve, reject, return)
   */
  canTakeActionOnItem(item: any): boolean {
    const userRole = this.authService.getUserRole();
    const status = item.status;

    // Unit Manager can only approve items in Pending status
    if (userRole === RolesEnums.UnitManager) {
      const result = status === ApprovalStatusEnum.Pending;
      return result;
    }

    // Region Manager can take action on items:
    // 1. That are in Pending status
    // 2. That are approved by Unit Manager
    if (userRole === RolesEnums.RegionManager) {
      const result =
        status === ApprovalStatusEnum.Pending ||
        status === ApprovalStatusEnum.ApprovedByUnitManager;
      return result;
    }

    // High Management can only take action on items approved by Region Manager
    if (userRole === RolesEnums.HighManagement) {
      const result = status === ApprovalStatusEnum.ApprovedByRegionManager;
      return result;
    }

    return false;
  }

  /**
   * Check if the current user has already taken action on the item
   * This is only used for UI display purposes and not for permission checks
   * @param status Current status of the item
   */
  isActionAlreadyTakenByCurrentUser(status: ApprovalStatusEnum): boolean {
    const userRole = this.authService.getUserRole();

    if (userRole === RolesEnums.UnitManager) {
      return status === ApprovalStatusEnum.ApprovedByUnitManager;
    }

    if (userRole === RolesEnums.RegionManager) {
      return FinishedByRegionManager.includes(status);
    }

    if (userRole === RolesEnums.HighManagement) {
      return FinishedByHighManagement.includes(status);
    }

    return false;
  }

  /**
   * Get the appropriate text for the approve button based on user role
   */
  getApproveButtonText(): string {
    const userRole = this.authService.getUserRole();

    switch (userRole) {
      case RolesEnums.UnitManager:
        return 'إرسال إلى مدير المنطقة';
      case RolesEnums.RegionManager:
        return 'إرسال إلى الإدارة العليا';
      case RolesEnums.HighManagement:
        return 'الموافقة النهائية';
      default:
        return 'تأكيد';
    }
  }
}
