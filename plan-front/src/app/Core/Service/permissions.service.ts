import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SharedDataService } from './shared-data.service';
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

export type ModuleType =
  | 'Plans'
  | 'Goals'
  | 'Analysis'
  | 'Reports'
  | 'Projects'
  | 'Initiative'
  | 'Direction';

export type PermissionType =
  | 'GetAll'
  | 'GetOne'
  | 'Approve'
  | 'Reject'
  | 'Return'
  | 'Add'
  | 'Update'
  | 'Delete';

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  private readonly baseUrl = '/Account';

  constructor(
    private http: HttpClient,
    private sharedDataService: SharedDataService,
    private authService: AuthService
  ) {}

  getPermissionsByUserId(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/UserPermessions/${userId}`).pipe(
      map((res: any) => ({
        modulePermissions: res.permissions || res.modulePermissions || {},
      }))
    );
  }

  getPermissions(userId: string): Observable<any> {
    return this.http.get(`/users/${userId}/permissions`);
  }

  // Update permissions for a specific user
  updateUserPermissions(
    userId: string,
    role: string,
    permissions: any
  ): Observable<any> {
    // const apiBaseUrl =  'https://jawda-backend.rawaqtech.com/update-permissions';
    const apiBaseUrl = '/Account/update-permissions';

    return this.http.post(`${apiBaseUrl}/${userId}`, {
      userId: Number(userId),
      role,
      modulePermissions: permissions.modulePermissions,
    });
  }

  // Get all permissions
  getAllPermissions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/Permissions`);
  }

  // Get permissions for a specific user
  getUserPermissions(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/UserPermissions/${userId}`).pipe(
      map((res: any) => ({
        modulePermissions: res.permissions || res.modulePermissions || {},
      }))
    );
  }

  // Get roles and permissions for all users
  getAllUsersRolesAndPermissions(roleId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/GetAllUsersRolesAndPermissions`, {
      params: { role: roleId },
    });
  }

  isAllowedToAccess(module: ModuleType, permission: PermissionType[]): boolean {
    const userInfo = localStorage.getItem('userInfo');
    let userRole: string | null = null;

    if (userInfo) {
      try {
        const parsedUserInfo = JSON.parse(userInfo);
        userRole = parsedUserInfo.role;
      } catch (err) {
        console.error('Error parsing user info:', err);
      }
    }

    let permissions = null;
    try {
      // Check if permissions are stored in localStorage first
      const storedPermissions = localStorage.getItem('permissions');
      if (storedPermissions) {
        permissions = JSON.parse(atob(storedPermissions));

        // Check if module exists in permissions
        if (!permissions?.[module]) {
          // Special case handling for managers if they don't have explicit permissions
          if (
            userRole === 'RegionManager' ||
            userRole === 'HighManagement' ||
            userRole === 'UnitManager'
          ) {
            if (
              (module === 'Analysis' ||
                module === 'Plans' ||
                module === 'Direction') &&
              (permission.includes('Approve') ||
                permission.includes('Reject') ||
                permission.includes('Return'))
            ) {
              return true;
            }
          }

          return false;
        }

        // Check if any of the required permissions exist for this module
        const hasPermission = permissions[module].some((p: PermissionType) =>
          permission.includes(p)
        );
        return hasPermission;
      } else {
        // Special case for managers with no permissions in localStorage
        if (
          userRole === 'RegionManager' ||
          userRole === 'HighManagement' ||
          userRole === 'UnitManager'
        ) {
          if (
            (module === 'Analysis' ||
              module === 'Plans' ||
              module === 'Direction') &&
            (permission.includes('Approve') ||
              permission.includes('Reject') ||
              permission.includes('Return'))
          ) {
            return true;
          }
        }
      }
    } catch (error) {
      console.error('Error parsing permissions:', error);
    }

    // If we couldn't get permissions from localStorage, return false
    return false;
  }

  // Observable to get the current permissions
  getPermissionsList(): Observable<Record<
    ModuleType,
    PermissionType[]
  > | null> {
    return this.sharedDataService.getPermissions();
  }

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
   * - Their own items that are in Pending status
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

    // Check if the current user is the creator
    let isCreator = false;
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsedUserInfo = JSON.parse(userInfo);
        const employeeId = parsedUserInfo.id;
        isCreator = employeeId && item.employeeId === employeeId;
      }
    } catch (error) {
      console.error('Error checking if employee is creator:', error);
    }

    // Employee can edit if:
    // 1. Item is in pending status and they created it, OR
    // 2. Item has been returned or rejected
    return (isPending && isCreator) || isReturned || isRejected;
  }

  /**
   * Check if the current user can delete an item
   * Unit employees can delete any pending items
   * @param item The item to check
   */
  canDeleteItem(item: any): boolean {
    const userRole = this.authService.getUserRole();

    // Only unit employees can delete items
    if (userRole !== RolesEnums.UnitEmployee) return false;

    // Check if item is in pending status (only pending items can be deleted)
    const isPending = PendingStatuses.includes(item.status);

    // Unit employee can delete any pending item
    return isPending;
  }

  /**
   * Check if the current user can approve the whole stage
   * Unit Managers, Region Managers, and High Management can approve whole stages
   * @param status Current status of the stage
   */
  canApproveWholeStage(status: string): boolean {
    const userRole = this.authService.getUserRole();

    // Unit Manager can approve if status is Pending
    if (userRole === RolesEnums.UnitManager) {
      return status === ApprovalStatusEnum.Pending;
    }

    // Region Manager can approve if approved by Unit Manager but not by Region Manager
    if (userRole === RolesEnums.RegionManager) {
      return status === ApprovalStatusEnum.ApprovedByUnitManager;
    }

    // High Management can approve if approved by Region Manager but not by High Management
    if (userRole === RolesEnums.HighManagement) {
      return status === ApprovalStatusEnum.ApprovedByRegionManager;
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
      return status === ApprovalStatusEnum.Pending;
    }

    // Region Manager can take action if not already actioned by Region Manager
    if (userRole === RolesEnums.RegionManager) {
      return (
        !FinishedByRegionManager.includes(status) &&
        (status === ApprovalStatusEnum.Pending ||
          status === ApprovalStatusEnum.ApprovedByUnitManager)
      );
    }

    // High Management can take action if not already actioned by High Management
    if (userRole === RolesEnums.HighManagement) {
      return (
        !FinishedByHighManagement.includes(status) &&
        status === ApprovalStatusEnum.ApprovedByRegionManager
      );
    }

    return false;
  }

  /**
   * Check if the current user has already taken action on the item
   * @param status Current status of the item
   */
  isActionAlreadyTakenByCurrentUser(status: string): boolean {
    const userRole = this.authService.getUserRole();

    if (userRole === RolesEnums.UnitManager) {
      return status === ApprovalStatusEnum.ApprovedByUnitManager;
    }

    if (userRole === RolesEnums.RegionManager) {
      return FinishedByRegionManager.includes(status as ApprovalStatusEnum);
    }

    if (userRole === RolesEnums.HighManagement) {
      return FinishedByHighManagement.includes(status as ApprovalStatusEnum);
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
