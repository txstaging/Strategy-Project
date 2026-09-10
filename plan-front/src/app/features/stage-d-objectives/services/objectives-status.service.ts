import { computed, inject, Injectable, signal } from '@angular/core';
import {
  ApprovalStatusEnum,
  RolesEnums,
  RejectionStatuses,
  ReturnedStatuses,
} from '../../../Core/utilities/consts';
import { AuthService } from '../../auth/services/auth.service';
import { ObjectiveService } from './objective.service';

@Injectable({
  providedIn: 'root',
})
export class ObjectivesStatusService {
  private authService = inject(AuthService);
  private objectiveService = inject(ObjectiveService);

  // Stage status signals
  private stageStatus = signal<ApprovalStatusEnum>(ApprovalStatusEnum.Pending);
  private objectivesList = signal<any[]>([]);
  private dataLoaded = signal(false);

  // Computed signals for button visibility
  canShowSubmitButton = computed(() => {
    const userRole = this.authService.getUserRole();
    const status = this.stageStatus();
    const allActedUpon = this.allObjectivesActedUpon();

    // Sequential workflow: Unit Manager → Region Manager → High Management
    // Each role can only act when it's their turn in the workflow

    if (userRole === RolesEnums.UnitManager) {
      // Unit Manager can submit when stage is pending and all objectives acted upon
      return status === ApprovalStatusEnum.Pending && allActedUpon;
    }

    if (userRole === RolesEnums.RegionManager) {
      // Region Manager can submit when stage is approved by Unit Manager and all objectives acted upon
      return (
        (status === ApprovalStatusEnum.ApprovedByUnitManager ||
          status === ApprovalStatusEnum.ApprovedByUnitManagerPartially) &&
        allActedUpon
      );
    }

    if (userRole === RolesEnums.HighManagement) {
      // High Management can submit when stage is approved by Region Manager and all objectives acted upon
      return (
        (status === ApprovalStatusEnum.ApprovedByRegionManager ||
          status === ApprovalStatusEnum.ApprovedByRegionManagerPartially) &&
        allActedUpon
      );
    }

    return false;
  });

  canShowResubmitButton = computed(() => {
    const userRole = this.authService.getUserRole();
    const allActedUpon = this.allObjectivesActedUpon();
    const canShowSubmit = this.canShowSubmitButton();
    const stageStatus = this.stageStatus();

    // Resubmit button appears when:
    // 1. All objectives have been acted upon by current role (no pending work)
    // 2. There are items approved by the CURRENT role ready for the next approval level
    // 3. Submit button is NOT showing (buttons are mutually exclusive)
    // 4. Stage is already approved by current role or beyond (key missing condition!)

    // If submit button is showing, don't show resubmit button (mutually exclusive)
    if (canShowSubmit) {
      return false;
    }

    if (userRole === RolesEnums.UnitManager) {
      // Only show resubmit button when stage is already approved by Unit Manager or beyond
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

      // If stage is already fully approved, don't show resubmit button
      if (
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially
      ) {
        return false;
      }

      // Unit Manager can resubmit when there are items THEY'VE approved (ready for Region Manager)
      const hasItemsForRegionManager = this.hasItemsApprovedByUnitManager();
      return allActedUpon && hasItemsForRegionManager;
    }

    if (userRole === RolesEnums.RegionManager) {
      // Only show resubmit button when stage is already approved by Region Manager or beyond
      if (
        stageStatus !== ApprovalStatusEnum.ApprovedByRegionManager &&
        stageStatus !== ApprovalStatusEnum.ApprovedByRegionManagerPartially &&
        stageStatus !== ApprovalStatusEnum.ApprovedByHighManagement &&
        stageStatus !== ApprovalStatusEnum.ApprovedByHighManagementPartially
      ) {
        return false;
      }

      // If stage is already fully approved, don't show resubmit button
      if (
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially
      ) {
        return false;
      }

      // Region Manager can resubmit when there are items THEY'VE approved (ready for High Management)
      const hasItemsForHighManagement = this.hasItemsApprovedByRegionManager();
      return allActedUpon && hasItemsForHighManagement;
    }

    // High Management is the final level - no resubmit needed
    return false;
  });

  // Public methods to update state
  setStageStatus(status: ApprovalStatusEnum) {
    this.stageStatus.set(status);
  }

  setObjectivesList(objectives: any[]) {
    this.objectivesList.set(objectives);
  }

  setDataLoaded(loaded: boolean) {
    this.dataLoaded.set(loaded);
  }

  isObjectivesDataLoaded(): boolean {
    return this.dataLoaded();
  }

  isObjectivesApproved(): boolean {
    return this.stageStatus() === ApprovalStatusEnum.ApprovedByHighManagement;
  }

  getStageStatus(): ApprovalStatusEnum {
    return this.stageStatus();
  }

  getObjectivesList(): any[] {
    return this.objectivesList();
  }

  // Private helper methods
  private allObjectivesActedUpon(): boolean {
    const userRole = this.authService.getUserRole();
    const objectives = this.objectivesList();

    if (!objectives || objectives.length === 0) {
      return false;
    }

    return objectives.every((objective) => {
      // Hard guard: a rejected or returned goal (at any level) blocks the stage
      // from being submitted until it is reworked and re-approved.
      if (
        RejectionStatuses.includes(objective.status) ||
        ReturnedStatuses.includes(objective.status) ||
        this.hasReturnedItems(objective)
      ) {
        return false;
      }

      // Only check goal-level actions, not individual items
      // Stage approval depends only on parent goal decisions
      const goalActedUpon = this.isGoalActedUponByRole(
        objective.status,
        userRole
      );

      return goalActedUpon;
    });
  }

  private isGoalActedUponByRole(
    goalStatus: string,
    userRole: string | null
  ): boolean {
    if (!userRole) return false;

    if (userRole === RolesEnums.UnitManager) {
      // A goal counts as ready only when it has been APPROVED at this level or
      // higher. Rejected/returned/pending goals block stage submission.
      return (
        goalStatus === ApprovalStatusEnum.ApprovedByUnitManager ||
        goalStatus === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
        goalStatus === ApprovalStatusEnum.ApprovedByRegionManager ||
        goalStatus === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
        goalStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        goalStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially
      );
    }

    if (userRole === RolesEnums.RegionManager) {
      // A goal counts as ready only when it has been APPROVED at this level or
      // higher. Rejected/returned/pending goals block stage submission.
      return (
        goalStatus === ApprovalStatusEnum.ApprovedByRegionManager ||
        goalStatus === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
        goalStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        goalStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially
      );
    }

    if (userRole === RolesEnums.HighManagement) {
      // A goal counts as ready only when High Management has APPROVED it.
      // Rejected/returned/pending goals block stage submission.
      return (
        goalStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        goalStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially
      );
    }

    return false;
  }

  private areGoalItemsActedUponByRole(
    goal: any,
    userRole: string | null
  ): boolean {
    if (!userRole) return false;

    const isItemActedUpon = (item: any): boolean => {
      if (!item || !item.status) return false;

      if (userRole === RolesEnums.UnitManager) {
        return (
          item.status === ApprovalStatusEnum.ApprovedByUnitManager ||
          item.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
          item.status === ApprovalStatusEnum.RejectedByUnitManager ||
          item.status === ApprovalStatusEnum.ReturnedByUnitManager
        );
      }

      if (userRole === RolesEnums.RegionManager) {
        return (
          item.status === ApprovalStatusEnum.ApprovedByRegionManager ||
          item.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
          item.status === ApprovalStatusEnum.RejectedByRegionManager ||
          item.status === ApprovalStatusEnum.ReturnedByRegionManager
        );
      }

      if (userRole === RolesEnums.HighManagement) {
        return (
          item.status === ApprovalStatusEnum.ApprovedByHighManagement ||
          item.status ===
            ApprovalStatusEnum.ApprovedByHighManagementPartially ||
          item.status === ApprovalStatusEnum.RejectedByHighManagement ||
          item.status === ApprovalStatusEnum.ReturnedByHighManagement
        );
      }

      return false;
    };

    const nameActedUpon = isItemActedUpon(goal.name);
    const descriptionActedUpon = isItemActedUpon(goal.descripition);
    const indicatorActedUpon = isItemActedUpon(goal.indicator);

    return nameActedUpon && descriptionActedUpon && indicatorActedUpon;
  }

  private hasReturnedItems(objective: any): boolean {
    // Check if the objective itself is returned
    if (ReturnedStatuses.includes(objective.status)) {
      return true;
    }

    // If the goal itself has a final status (approved/rejected),
    // then returned child items don't block stage approval
    const goalHasFinalStatus = this.isGoalActedUponByRole(
      objective.status,
      this.authService.getUserRole()
    );

    if (goalHasFinalStatus) {
      // Goal is approved/rejected - stage can proceed regardless of child item status
      return false;
    }

    // Goal is still pending - check if any child items are returned
    const nameReturned =
      objective.name?.status &&
      ReturnedStatuses.includes(objective.name.status);
    const descriptionReturned =
      objective.descripition?.status &&
      ReturnedStatuses.includes(objective.descripition.status);
    const indicatorReturned =
      objective.indicator?.status &&
      ReturnedStatuses.includes(objective.indicator.status);

    return nameReturned || descriptionReturned || indicatorReturned;
  }

  private hasUnitManagerApprovedItems(): boolean {
    const objectives = this.objectivesList();

    return objectives.some((objective) => {
      // Check if there are objectives with Unit Manager approval status
      const goalApprovedByUnitManager =
        objective.status === ApprovalStatusEnum.ApprovedByUnitManager ||
        objective.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially;

      const nameApprovedByUnitManager =
        objective.name?.status === ApprovalStatusEnum.ApprovedByUnitManager ||
        objective.name?.status ===
          ApprovalStatusEnum.ApprovedByUnitManagerPartially;

      const descriptionApprovedByUnitManager =
        objective.descripition?.status ===
          ApprovalStatusEnum.ApprovedByUnitManager ||
        objective.descripition?.status ===
          ApprovalStatusEnum.ApprovedByUnitManagerPartially;

      const indicatorApprovedByUnitManager =
        objective.indicator?.status ===
          ApprovalStatusEnum.ApprovedByUnitManager ||
        objective.indicator?.status ===
          ApprovalStatusEnum.ApprovedByUnitManagerPartially;

      return (
        goalApprovedByUnitManager ||
        nameApprovedByUnitManager ||
        descriptionApprovedByUnitManager ||
        indicatorApprovedByUnitManager
      );
    });
  }

  private hasItemsApprovedByUnitManager(): boolean {
    const objectives = this.objectivesList();

    return objectives.some((objective) => {
      // Check for goals approved by Unit Manager (ready for Region Manager)
      return (
        objective.status === ApprovalStatusEnum.ApprovedByUnitManager ||
        objective.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      );
    });
  }

  private hasItemsApprovedByRegionManager(): boolean {
    const objectives = this.objectivesList();

    return objectives.some((objective) => {
      // Check for goals approved by Region Manager (ready for High Management)
      return (
        objective.status === ApprovalStatusEnum.ApprovedByRegionManager ||
        objective.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      );
    });
  }

  // Method to get button disabled reason
  getButtonDisabledReason(): string | null {
    const objectives = this.objectivesList();

    if (!objectives || objectives.length === 0) {
      return 'لا توجد أهداف للموافقة عليها';
    }

    // Check if user can act on this stage
    const canActOnStage = this.canActOnCurrentStage();

    if (!canActOnStage) {
      return this.getStageWaitingMessage();
    }

    // Check for returned items first
    const hasReturnedItems = objectives.some((objective) =>
      this.hasReturnedItems(objective)
    );
    if (hasReturnedItems) {
      return 'يوجد أهداف مُرجعة، يجب معالجتها قبل إرسال المرحلة';
    }

    // Check if all objectives have been acted upon
    const allActedUpon = this.allObjectivesActedUpon();

    if (!allActedUpon) {
      // More specific message about what's blocking
      const userRole = this.authService.getUserRole();
      const pendingGoals = this.getPendingItemsDetails(userRole);
      if (pendingGoals.length > 0) {
        return `يجب اتخاذ إجراء على الأهداف التالية: ${pendingGoals.join('، ')}`;
      }
      return 'يجب اتخاذ إجراء على جميع الأهداف قبل الموافقة على المرحلة';
    }

    return null; // No disabled reason, button should be enabled
  }

  private getPendingItemsDetails(userRole: string | null): string[] {
    const objectives = this.objectivesList();
    const pendingGoals: string[] = [];

    objectives.forEach((objective, index) => {
      // Skip if this objective has returned items
      if (this.hasReturnedItems(objective)) {
        return;
      }

      // Check if the goal itself has been acted upon
      const goalActedUpon = this.isGoalActedUponByRole(
        objective.status,
        userRole
      );

      if (!goalActedUpon) {
        // Goal is pending - add it to the list
        pendingGoals.push(`الهدف ${index + 1}`);
      }
    });

    return pendingGoals;
  }

  private isItemActedUponByRole(item: any, userRole: string | null): boolean {
    if (!item || !item.status || !userRole) return false;

    if (userRole === RolesEnums.UnitManager) {
      return (
        item.status === ApprovalStatusEnum.ApprovedByUnitManager ||
        item.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
        item.status === ApprovalStatusEnum.RejectedByUnitManager ||
        item.status === ApprovalStatusEnum.ReturnedByUnitManager
      );
    }

    if (userRole === RolesEnums.RegionManager) {
      return (
        item.status === ApprovalStatusEnum.ApprovedByRegionManager ||
        item.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
        item.status === ApprovalStatusEnum.RejectedByRegionManager ||
        item.status === ApprovalStatusEnum.ReturnedByRegionManager
      );
    }

    if (userRole === RolesEnums.HighManagement) {
      return (
        item.status === ApprovalStatusEnum.ApprovedByHighManagement ||
        item.status === ApprovalStatusEnum.ApprovedByHighManagementPartially ||
        item.status === ApprovalStatusEnum.RejectedByHighManagement ||
        item.status === ApprovalStatusEnum.ReturnedByHighManagement
      );
    }

    return false;
  }

  private canActOnCurrentStage(): boolean {
    const userRole = this.authService.getUserRole();
    const status = this.stageStatus();

    if (userRole === RolesEnums.UnitManager) {
      return status === ApprovalStatusEnum.Pending;
    }

    if (userRole === RolesEnums.RegionManager) {
      return (
        status === ApprovalStatusEnum.ApprovedByUnitManager ||
        status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      );
    }

    if (userRole === RolesEnums.HighManagement) {
      return (
        status === ApprovalStatusEnum.ApprovedByRegionManager ||
        status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      );
    }

    return false;
  }

  private getStageWaitingMessage(): string {
    const userRole = this.authService.getUserRole();
    const status = this.stageStatus();

    if (status === ApprovalStatusEnum.ApprovedByHighManagement) {
      return 'تم اعتماد مرحلة الأهداف بالكامل';
    }

    if (userRole === RolesEnums.UnitEmployee) {
      if (status === ApprovalStatusEnum.Pending) {
        return 'في انتظار موافقة مدير الوحدة';
      }
      if (
        status === ApprovalStatusEnum.ApprovedByUnitManager ||
        status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      ) {
        return 'في انتظار موافقة مدير المنطقة';
      }
      if (
        status === ApprovalStatusEnum.ApprovedByRegionManager ||
        status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      ) {
        return 'في انتظار موافقة الإدارة العليا';
      }
    }

    if (userRole === RolesEnums.UnitManager) {
      if (
        status === ApprovalStatusEnum.ApprovedByUnitManager ||
        status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      ) {
        return 'في انتظار موافقة مدير المنطقة';
      }
      if (
        status === ApprovalStatusEnum.ApprovedByRegionManager ||
        status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      ) {
        return 'في انتظار موافقة الإدارة العليا';
      }
    }

    if (userRole === RolesEnums.RegionManager) {
      if (status === ApprovalStatusEnum.Pending) {
        return 'في انتظار موافقة مدير الوحدة';
      }
      if (
        status === ApprovalStatusEnum.ApprovedByRegionManager ||
        status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      ) {
        return 'في انتظار موافقة الإدارة العليا';
      }
    }

    if (userRole === RolesEnums.HighManagement) {
      if (status === ApprovalStatusEnum.Pending) {
        return 'في انتظار موافقة مدير الوحدة';
      }
      if (
        status === ApprovalStatusEnum.ApprovedByUnitManager ||
        status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      ) {
        return 'في انتظار موافقة مدير المنطقة';
      }
    }

    return 'في انتظار الموافقة';
  }
}
