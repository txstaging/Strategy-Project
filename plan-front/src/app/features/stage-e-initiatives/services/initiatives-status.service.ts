import { computed, inject, Injectable, signal } from '@angular/core';
import {
  ApprovalStatusEnum,
  RolesEnums,
  RejectionStatuses,
  ReturnedStatuses,
} from '../../../Core/utilities/consts';
import { AuthService } from '../../../features/auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class InitiativesStatusService {
  private authService = inject(AuthService);

  // Reactive signals
  private stageStatus = signal<ApprovalStatusEnum>(ApprovalStatusEnum.Pending);
  private initiativesList = signal<any[]>([]);
  private dataLoaded = signal(false);

  // Computed properties for button visibility
  canShowSubmitButton = computed(() => {
    const allActedUpon = this.allInitiativesActedUpon();
    const hasReturnedItems = this.hasReturnedItems();

    // Don't show submit button if there are returned items that need to be addressed
    if (hasReturnedItems) {
      return false;
    }

    // Check if user can approve stage based on their role and stage status
    const canApproveStage = this.canApproveStageBasedOnRole();

    // Show submit button if user can approve and all initiatives are acted upon
    return canApproveStage && allActedUpon;
  });

  canShowResubmitButton = computed(() => {
    const userRole = this.authService.getUserRole();
    const stageStatus = this.stageStatus();
    const allActedUpon = this.allInitiativesActedUpon();
    const hasReturnedItems = this.hasReturnedItems();

    // Don't show resubmit button if there are returned items that need to be addressed
    if (hasReturnedItems) {
      return false;
    }

    // Only show resubmit button when stage is already approved by current role or beyond
    if (
      stageStatus !== ApprovalStatusEnum.ApprovedByUnitManager &&
      stageStatus !== ApprovalStatusEnum.ApprovedByUnitManagerPartially &&
      stageStatus !== ApprovalStatusEnum.ApprovedByRegionManager &&
      stageStatus !== ApprovalStatusEnum.ApprovedByRegionManagerPartially &&
      stageStatus !== ApprovalStatusEnum.ApprovedByHighManagement &&
      stageStatus !== ApprovalStatusEnum.ApprovedByHighManagementPartially
    ) {
      return false;
    }

    // If submit button is showing, don't show resubmit button (mutually exclusive)
    if (this.canShowSubmitButton()) {
      return false;
    }

    if (userRole === RolesEnums.UnitManager) {
      // Unit Manager can resubmit when there are items THEY'VE approved (ready for Region Manager)
      const hasItemsForRegionManager = this.hasItemsApprovedByUnitManager();
      return allActedUpon && hasItemsForRegionManager;
    }

    if (userRole === RolesEnums.RegionManager) {
      // Region Manager can resubmit when there are items THEY'VE approved (ready for High Management)
      const hasItemsForHighManagement = this.hasItemsApprovedByRegionManager();
      return allActedUpon && hasItemsForHighManagement;
    }

    return false;
  });

  // Computed property for approval status
  isInitiativesApproved = computed(() => {
    const status = this.stageStatus();
    return status === ApprovalStatusEnum.ApprovedByHighManagement;
  });

  // Get button disabled reason
  getButtonDisabledReason = computed(() => {
    const userRole = this.authService.getUserRole();
    const allActedUpon = this.allInitiativesActedUpon();
    const hasReturnedItems = this.hasReturnedItems();

    // Check if there are returned items that need to be addressed
    if (hasReturnedItems) {
      return 'يوجد مبادرات مُرجعة، يجب معالجتها قبل إرسال المرحلة';
    }

    // Check if all initiatives are acted upon
    if (!allActedUpon) {
      return 'يجب اتخاذ إجراء على جميع المبادرات قبل إرسال المرحلة';
    }

    // Check stage approval status
    if (this.isInitiativesApproved()) {
      return 'تم اعتماد مرحلة المبادرات';
    }

    // Check role-based authorization
    if (!this.canApproveStageBasedOnRole()) {
      if (userRole === RolesEnums.UnitManager) {
        return 'المرحلة ليست في حالة انتظار موافقة مدير الوحدة';
      } else if (userRole === RolesEnums.RegionManager) {
        return 'المرحلة ليست في حالة انتظار موافقة مدير المنطقة';
      } else if (userRole === RolesEnums.HighManagement) {
        return 'المرحلة ليست في حالة انتظار موافقة الإدارة العليا';
      }
    }

    return null;
  });

  // Public methods to update state
  setStageStatus(status: ApprovalStatusEnum): void {
    this.stageStatus.set(status);
  }

  setInitiativesList(initiatives: any[]): void {
    this.initiativesList.set(initiatives);
  }

  setDataLoaded(loaded: boolean): void {
    this.dataLoaded.set(loaded);
  }

  isInitiativesDataLoaded(): boolean {
    return this.dataLoaded();
  }

  getStageStatus(): ApprovalStatusEnum {
    return this.stageStatus();
  }

  // Private helper methods
  private canApproveStageBasedOnRole(): boolean {
    const userRole = this.authService.getUserRole();
    const stageStatus = this.stageStatus();

    if (
      userRole !== RolesEnums.UnitManager &&
      userRole !== RolesEnums.RegionManager &&
      userRole !== RolesEnums.HighManagement
    ) {
      return false;
    }

    // Already approved at this role's level or beyond, so there is nothing left
    // for this role to approve.
    //
    // The ladder itself is enforced by the initiatives, not by the step: the
    // caller pairs this with allInitiativesActedUpon, which only passes once
    // every initiative sits at this role's level or above. Requiring the *step*
    // to sit exactly at the previous level as well used to deadlock the stage,
    // because the step only moves on a whole-stage approval while the per-item
    // endpoints apply the acting role's status whatever level the item is at.
    // Once the two drift apart, no role's button matched and nobody could
    // approve the stage.
    return !this.isInitiativeActedUponByRole(stageStatus, userRole);
  }

  private allInitiativesActedUpon(): boolean {
    const userRole = this.authService.getUserRole();
    const initiatives = this.initiativesList();

    if (!initiatives || initiatives.length === 0) {
      return false; // No initiatives to act upon
    }

    // Check each initiative (initiative level + items level)
    const allActedUpon = initiatives.every((initiative) => {
      // Hard guard: a rejected or returned initiative (at any level) blocks the
      // stage from being submitted until it is reworked and re-approved.
      if (
        RejectionStatuses.includes(initiative.status) ||
        ReturnedStatuses.includes(initiative.status)
      ) {
        return false;
      }

      // 1. Check initiative-level approval
      const initiativeActedUpon = this.isInitiativeActedUponByRole(
        initiative.status,
        userRole
      );

      // 2. Check initiative items approval (if detailed data is available)
      const itemsActedUpon = this.areInitiativeItemsActedUponByRole(
        initiative,
        userRole
      );

      return initiativeActedUpon && itemsActedUpon;
    });

    return allActedUpon;
  }

  private isInitiativeActedUponByRole(
    initiativeStatus: string,
    userRole: string | null
  ): boolean {
    if (!userRole) return false;

    // An initiative counts as ready only when it has been APPROVED at this level
    // or higher. Rejected/returned/pending initiatives block stage submission.
    if (userRole === RolesEnums.UnitManager) {
      return (
        initiativeStatus === ApprovalStatusEnum.ApprovedByUnitManager ||
        initiativeStatus ===
          ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
        initiativeStatus === ApprovalStatusEnum.ApprovedByRegionManager ||
        initiativeStatus ===
          ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
        initiativeStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        initiativeStatus ===
          ApprovalStatusEnum.ApprovedByHighManagementPartially
      );
    }

    if (userRole === RolesEnums.RegionManager) {
      return (
        initiativeStatus === ApprovalStatusEnum.ApprovedByRegionManager ||
        initiativeStatus ===
          ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
        initiativeStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        initiativeStatus ===
          ApprovalStatusEnum.ApprovedByHighManagementPartially
      );
    }

    if (userRole === RolesEnums.HighManagement) {
      return (
        initiativeStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        initiativeStatus ===
          ApprovalStatusEnum.ApprovedByHighManagementPartially
      );
    }

    return false;
  }

  private areInitiativeItemsActedUponByRole(
    initiative: any,
    userRole: string | null
  ): boolean {
    if (!userRole) return false;

    // For list view data (flat structure), we can't check individual items
    // so we assume items are acted upon if the initiative itself is acted upon
    if (!initiative.name || typeof initiative.name !== 'object') {
      return true; // Can't validate items, assume they're handled
    }

    // For detailed data structure (from getInitiativeById)
    const isItemActedUpon = (item: any): boolean => {
      if (!item || !item.status) return false;

      // An item counts as ready only when it has been APPROVED at this level or
      // higher. Rejected/returned/pending items block stage submission.
      if (userRole === RolesEnums.UnitManager) {
        return (
          item.status === ApprovalStatusEnum.ApprovedByUnitManager ||
          item.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
          item.status === ApprovalStatusEnum.ApprovedByRegionManager ||
          item.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
          item.status === ApprovalStatusEnum.ApprovedByHighManagement ||
          item.status === ApprovalStatusEnum.ApprovedByHighManagementPartially
        );
      }

      if (userRole === RolesEnums.RegionManager) {
        return (
          item.status === ApprovalStatusEnum.ApprovedByRegionManager ||
          item.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
          item.status === ApprovalStatusEnum.ApprovedByHighManagement ||
          item.status === ApprovalStatusEnum.ApprovedByHighManagementPartially
        );
      }

      if (userRole === RolesEnums.HighManagement) {
        return (
          item.status === ApprovalStatusEnum.ApprovedByHighManagement ||
          item.status === ApprovalStatusEnum.ApprovedByHighManagementPartially
        );
      }

      return false;
    };

    // Check name
    const nameActedUpon = isItemActedUpon(initiative.name);

    // Check all KPIs
    const kpisActedUpon =
      initiative.initiativeKPIs?.every((kpi: any) => isItemActedUpon(kpi)) ??
      true;

    // Check all initiative items
    const itemsActedUpon =
      initiative.initiativeItem?.every((item: any) => isItemActedUpon(item)) ??
      true;

    return nameActedUpon && kpisActedUpon && itemsActedUpon;
  }

  private hasReturnedItems(): boolean {
    const initiatives = this.initiativesList();

    return initiatives.some((initiative) => {
      // Check if the initiative itself is returned
      if (ReturnedStatuses.includes(initiative.status)) {
        return true;
      }

      // Check if any items within the initiative are returned (for detailed data)
      if (initiative.name && typeof initiative.name === 'object') {
        // Check name
        if (
          initiative.name.status &&
          ReturnedStatuses.includes(initiative.name.status)
        ) {
          return true;
        }

        // Check KPIs
        if (
          initiative.initiativeKPIs?.some(
            (kpi: any) => kpi.status && ReturnedStatuses.includes(kpi.status)
          )
        ) {
          return true;
        }

        // Check initiative items
        if (
          initiative.initiativeItem?.some(
            (item: any) => item.status && ReturnedStatuses.includes(item.status)
          )
        ) {
          return true;
        }
      }

      return false;
    });
  }

  private hasItemsApprovedByUnitManager(): boolean {
    const initiatives = this.initiativesList();

    return initiatives.some((initiative) => {
      return (
        initiative.status === ApprovalStatusEnum.ApprovedByUnitManager ||
        initiative.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      );
    });
  }

  private hasItemsApprovedByRegionManager(): boolean {
    const initiatives = this.initiativesList();

    return initiatives.some((initiative) => {
      return (
        initiative.status === ApprovalStatusEnum.ApprovedByRegionManager ||
        initiative.status ===
          ApprovalStatusEnum.ApprovedByRegionManagerPartially
      );
    });
  }
}
