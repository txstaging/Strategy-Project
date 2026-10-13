import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SharedDataService } from '../../../../Core/Service/shared-data.service';
import {
  ApprovalStatusEnum,
  PendingStatuses,
  RejectionStatuses,
  ReturnedStatuses,
  RolesEnums,
} from '../../../../Core/utilities/consts';
import { isActionAlreadyTakenByTheCurrentManager } from '../../../../Core/utilities/utils';
import { AuthService } from '../../../../features/auth/services/auth.service';
import { PlanStatusService } from '../../../../features/stage-b-analysis/services/PlanStatus.service';
import { CommentModalComponent } from '../../../../shared/components/comment-form/app-comment-form.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { PopupComponent } from '../../../../shared/components/popup/popup.component';
import { StatusActionComponent } from '../../../../shared/components/status-action/status.component';
import { ObjectiveService } from '../../services/objective.service';
import { ObjectivesStatusService } from '../../services/objectives-status.service';
import { ObjectivesStageAddComponent } from '../objectives-stage-add/objectives-stage-add.component';
import { ObjectivesStageDetailsComponent } from '../objectives-stage-details/objectives-stage-details.component';
import { ObjectivesStageEmptyComponent } from '../objectives-stage-empty/objectives-stage-empty.component';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PdfService } from '../../../../pdf.service';
import { ApproveAllService } from '../../../../approve-all.service';
import { PermissionsService } from '../../../../Core/Service/permissions.service';
@Component({
  selector: 'app-objectives-stage-table',
  standalone: true,
  imports: [
    CommonModule,
    ObjectivesStageAddComponent,
    ObjectivesStageDetailsComponent,
    StatusActionComponent,
    PopupComponent,
    CommentModalComponent,
    PaginationComponent,
    RouterLink,
    ObjectivesStageEmptyComponent,
    FormsModule,
  ],
  templateUrl: './objectives-stage-table.component.html',
  styleUrl: './objectives-stage-table.component.css',
})
export class ObjectivesStageTableComponent implements OnInit, OnDestroy {
  private permissionsService = inject(PermissionsService);
  // Make enum available in template
  ApprovalStatusEnum = ApprovalStatusEnum;

  selectedObjectiveId: string | undefined;
  showObjectiveDetailsModal = false;
  showActionModal = signal(false);
  showObjectiveAddAndUpdateModal = false;
  objectiveId = '';
  isAdmin = false;
  ObjectivesList = signal<any[]>([]);
  filteredObjectivesList = signal<any[]>([]);
  planId = '';
  detailsData = signal<any>(null);
  createAndEditModalMode: 'create' | 'edit' = 'create';
  currentPage = 1;
  totalPages: any = null;
  planGoalStatus: WritableSignal<ApprovalStatusEnum> = signal(
    ApprovalStatusEnum.Pending
  );
  showObjectivesSubmissionBtn = false;
  showObjectivesResubmitBtn = false;
  isObjectivesApproved = false;
  showCommentModal = false;
  reasonModalType: 'reject' | 'return' | null = null;
  isSuccessPopupVisible = false;
  isInitiativesStageActive = false;
  buttonDisabledReason: string | null = null;

  // Button text properties
  approveButtonText = 'تأكيد';
  resubmitButtonText = 'إعادة إرسال المرحلة';

  // Filter properties
  filterStatus = '';
  filterUnit = '';
  availableStatuses = signal<string[]>([]);
  availableUnits = signal<string[]>([]);

  private planStatusService = inject(PlanStatusService);
  public objectivesStatusService = inject(ObjectivesStatusService);

  // Cache for goal validation to prevent excessive recalculation
  private goalValidationCache = new Map<
    string,
    { canApprove: boolean; message: string | null; timestamp: number }
  >();
  private readonly CACHE_DURATION = 5000; // 5 seconds cache

  // Subscriptions for cleanup
  private routeParamsSubscription?: Subscription;
  private queryParamsSubscription?: Subscription;

  constructor(
    private objectiveService: ObjectiveService,
    private sharedDataService: SharedDataService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private pdf:PdfService,
    private app:ApproveAllService
  ) {
    // Don't get planId from SharedDataService in constructor
    // It will be properly set in ngOnInit from route params

    // Set up reactive effects for button visibility
    effect(() => {
      this.showObjectivesSubmissionBtn =
        this.objectivesStatusService.canShowSubmitButton();
      this.showObjectivesResubmitBtn =
        this.objectivesStatusService.canShowResubmitButton();
      this.buttonDisabledReason =
        this.objectivesStatusService.getButtonDisabledReason();
      this.isObjectivesApproved =
        this.objectivesStatusService.isObjectivesApproved();
    });
  }

  ngOnInit() {
    // Always prioritize route params for planId to avoid caching issues
    this.routeParamsSubscription = this.route.params.subscribe((params) => {
      const routePlanId = params['planId'];
      if (routePlanId) {
        // Update plan ID if it changed
        if (this.planId !== routePlanId) {
          console.log(`Plan ID changed from ${this.planId} to ${routePlanId}`);
          this.planId = routePlanId;
          this.sharedDataService.setPlanId(routePlanId);

          // Clear any cached data when plan ID changes
          this.clearValidationCache();

          // Reload data with new plan ID
          this.initializeData();
        }
      } else {
        console.error('No planId found in route parameters');
      }
    });

    this.queryParamsSubscription = this.route.queryParams.subscribe(
      (params) => {
        const Year = params['year'];
        const UnitId = params['UnitId'];
        const selectedParams: any = {};
        if (UnitId) selectedParams['UnitId'] = UnitId;
        if (Year) selectedParams['Year'] = Year;

        // Only initialize data if we have a plan ID
        if (this.planId) {
          this.initializeData();
        }
      }
    );

    this.isAdmin = this.authService.allowInRoles([
      RolesEnums.HighManagement,
      RolesEnums.RegionManager,
      RolesEnums.UnitManager,
    ]);

    this.cdr.detectChanges();
    document.addEventListener('click', this.handleClickOutside.bind(this));
    document.addEventListener(
      'click',
      this.handleClickOutsideAddUpdateModal.bind(this)
    );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.routeParamsSubscription?.unsubscribe();
    this.queryParamsSubscription?.unsubscribe();

    // Clean up event listeners
    document.removeEventListener('click', this.handleClickOutside.bind(this));
    document.removeEventListener(
      'click',
      this.handleClickOutsideAddUpdateModal.bind(this)
    );
  }

  private handleClickOutside(event: MouseEvent): void {
    const overlay = document.querySelector('.popup-overlay');
    if (
      this.showObjectiveDetailsModal &&
      overlay &&
      overlay.contains(event.target as Node)
    ) {
      this.showObjectiveDetailsModal = false;
      this.cdr.detectChanges();
    }
  }

  private handleClickOutsideAddUpdateModal(event: MouseEvent): void {
    const overlay = document.querySelector('.popup-overlay');
    if (
      this.showObjectiveAddAndUpdateModal &&
      overlay &&
      overlay.contains(event.target as Node)
    ) {
      this.showObjectiveAddAndUpdateModal = false;
      this.cdr.detectChanges();
    }
  }

  handleClose() {
    this.loadObjectives();
  }

  closeDetailsModal() {
    this.showObjectiveDetailsModal = false;
    this.detailsData.set(null);
    this.objectiveId = '';
  }

  isActionAlreadyTakenByTheCurrentManager(status: string) {
    const userRole = this.authService.getUserRole();

    return isActionAlreadyTakenByTheCurrentManager(status, userRole!);
  }

  handleAccept(item: any) {
    if (!item) return;
    if (this.planId)
      this.objectiveService.approveGoal(item).subscribe(() => {
        // Clear validation cache since data has been updated
        this.clearValidationCache();
        this.loadObjectives();
      });
  }

  handleReject(item: any) {
    this.showCommentModal = true;
    this.selectedObjectiveId = item;
    this.reasonModalType = 'reject';
  }

  handleReturn(item: any) {
    this.showCommentModal = true;
    this.selectedObjectiveId = item;
    this.reasonModalType = 'return';
  }

  getPlanStatus() {
    if (!this.planId) {
      console.error('Cannot get plan status: Plan ID not available');
      return;
    }

    this.objectiveService.getPlanGoalsStatus(this.planId).subscribe({
      next: (response) => {
        // Set the plan goal status from the response
        this.planGoalStatus.set(response.status as ApprovalStatusEnum);

        // Update the status service
        this.objectivesStatusService.setStageStatus(
          response.status as ApprovalStatusEnum
        );

        // Now load the objectives data first, then determine submission button visibility
        this.loadObjectives();

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching plan goals status:', error);

        // If status fetch fails, still try to load objectives with default status
        this.planGoalStatus.set(ApprovalStatusEnum.Pending);
        this.objectivesStatusService.setStageStatus(ApprovalStatusEnum.Pending);
        this.loadObjectives();
      },
    });
  }

  loadObjectives() {
    if (!this.planId) {
      console.error('Cannot load objectives: Plan ID not available');
      return;
    }

    this.objectiveService.getAllGoals(this.planId).subscribe({
      next: (response) => {
        // Set the objectives data
        this.ObjectivesList.set(response.data || []);

        // Update the status service with objectives data
        this.objectivesStatusService.setObjectivesList(response.data || []);
        this.objectivesStatusService.setDataLoaded(true);

        // Extract filter options and apply initial filters
        this.extractFilterOptions();
        this.applyFilters();

        // Update pagination metadata
        if (response.metadata) {
          this.currentPage = response.metadata.currentPage;
          this.totalPages = Math.ceil(
            response.metadata.total / response.metadata.perPage
          );
        } else {
          // Fallback if metadata is missing
          this.currentPage = 1;
          this.totalPages = response.data && response.data.length > 0 ? 1 : 0;
        }

        // Clear validation cache since data has been updated
        this.clearValidationCache();

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading objectives:', error);

        // Set empty data on error
        this.ObjectivesList.set([]);
        this.objectivesStatusService.setObjectivesList([]);
        this.objectivesStatusService.setDataLoaded(true);
        this.currentPage = 1;
        this.totalPages = 0;

        this.cdr.detectChanges();
      },
    });
  }

  viewObjective() {
    if (this.planId && this.objectiveId) {
      this.objectiveService.getGoalById(this.objectiveId).subscribe({
        next: (res) => {
          if (res && res.data && res.data.id) {
            this.detailsData.set(res.data);
          } else {
            this.detailsData.set(null);
          }
        },
        error: (error) => {
          console.error('Error fetching objective details:', error);
          console.error('Error details:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            url: error.url,
          });
          this.detailsData.set(null);
        },
      });
    } else {
      console.error('Cannot fetch objective: Missing planId or objectiveId');
      console.error('Current values:', {
        planId: this.planId,
        objectiveId: this.objectiveId,
      });
    }
  }

  acceptablePoints() {
    if (this.planId)
      this.objectiveService.getAcceptablePoints(this.planId).subscribe({
        next: () => {
          this.loadObjectives();
        },
      });
  }

  approveObjective() {
    if (this.planId) {
      // Use the correct API for approving the stage
      this.objectiveService.approvePlanGoalStage(this.planId).subscribe({
        next: () => {
          this.isSuccessPopupVisible = true;
          // Refresh plan status to update button visibility
          this.getPlanStatus();
          // Also check initiatives stage status to show "To Initiatives" button
          this.checkInitiativesStageStatus();
        },
        error: (error) => {
          console.error('Error approving objectives stage:', error);
        },
      });
    }
  }

  updateObjective(data: any) {
    if (this.planId)
      this.objectiveService.updateGoal(data).subscribe({
        next: () => {
          this.loadObjectives();
          this.showObjectiveAddAndUpdateModal = false;
        },
      });
  }

  openCreateModal() {
    this.createAndEditModalMode = 'create';
    this.showObjectiveAddAndUpdateModal = true;
  }

  toggleActionPopup() {
    this.showActionModal.update((prev) => !prev);
  }

  onSelectedOption(option: any) {
    this.objectiveId = option.id;

    // Find the objective for permission checking
    const objective = this.ObjectivesList().find((obj) => obj.id === option.id);

    switch (option.type) {
      case 'view':
        this.viewObjective();
        this.showObjectiveDetailsModal = true;
        break;
      case 'edit':
        // Check if Unit Employee can edit this goal.
        // Editable while not yet approved; a reject/return reopens it.
        if (!this.canEditGoal(objective)) {
          console.warn('Unit Employee cannot edit goal - it is already approved');
          alert('لا يمكن تعديل الهدف بعد اعتماده');
          return;
        }

        this.viewObjective();
        this.createAndEditModalMode = 'edit';
        this.showObjectiveAddAndUpdateModal = true;
        this.cdr.detectChanges();
        break;
      case 'delete':
        // Check if Unit Employee can delete this goal.
        // Deletable under the same rule as edit (while not yet approved).
        if (!this.canDeleteGoal(objective)) {
          console.warn('Unit Employee cannot delete goal - it is already approved');
          alert('لا يمكن حذف الهدف بعد اعتماده');
          return;
        }

        // Show confirmation dialog
        if (confirm('هل أنت متأكد من حذف هذا الهدف؟')) {
          this.objectiveService.deleteGoal(option.id).subscribe({
            next: () => {
              this.loadObjectives();
            },
            error: (error) => {
              console.error('Error deleting goal:', error);
              alert('حدث خطأ أثناء حذف الهدف');
            },
          });
        }
        break;
      default:
        console.warn('Unknown option type:', option.type);
        break;
    }
  }
  onPageChange(page: number) {
    this.currentPage = page;
    this.loadObjectives();
  }

  closeSuccessPopup() {
    this.isSuccessPopupVisible = false;
  }

  handleRestore(reason: string) {
    if (!this.selectedObjectiveId) return;
    if (this.reasonModalType === 'return') {
      this.objectiveService
        .returnGoal(this.planId!, this.selectedObjectiveId, reason)
        .subscribe(() => {
          // Clear validation cache since data has been updated
          this.clearValidationCache();
          this.loadObjectives();
          this.selectedObjectiveId = undefined;
          this.reasonModalType = null;
        });
    } else if (this.reasonModalType === 'reject') {
      this.objectiveService
        .rejectGoal(this.planId!, this.selectedObjectiveId, reason)
        .subscribe(() => {
          // Clear validation cache since data has been updated
          this.clearValidationCache();
          this.loadObjectives();
          this.selectedObjectiveId = undefined;
          this.reasonModalType = null;
        });
    }
  }

  /**
   * Checks if an employee can edit an objective based on its status
   * According to workflow:
   * - Unit Employees can edit items that are:
   *   1. In Pending status (not yet processed)
   *   2. In Returned status (need to be fixed based on feedback)
   *   (Cannot edit approved or rejected items)
   * @param item The objective item to check
   * @returns boolean indicating if the employee can edit the item
   */
  canEditBasedOnStatus(item: any): boolean {
    // If item is null or doesn't have status, return false
    if (!item || !item.status) return false;

    // Get the current user role
    const userRole = this.authService.getUserRole();
    if (!userRole) return false;

    // If user is not an employee, this function is not relevant
    if (userRole !== RolesEnums.UnitEmployee) return false;

    // Check if item is in a valid status for editing
    const isReturned = ReturnedStatuses.includes(item.status);
    const isRejected = RejectionStatuses.includes(item.status);
    const isDraft = item.status === ApprovalStatusEnum.SavedAsDraft;

    return isReturned || isRejected || isDraft;
  }

  /**
   * Check if user can take action on a goal (goal-level approval).
   * Uses the stage-aware ladder shared with the backend
   * (ObjectivesStatusService.canActOn / Utils.CanRoleActInStage).
   * Note: Individual items within goals are handled separately in the details modal
   * @param status The status of the goal to check
   */
  canTakeAction(status: string): boolean {
    return this.objectivesStatusService.canActOn(status);
  }

  /**
   * Check if the current user can add new objectives
   * According to workflow, only unit employees can add new objectives
   * @returns boolean indicating if the user can add objectives
   */
  canAddItems(): boolean {
    const userRole = this.authService.getUserRole();
    return userRole === RolesEnums.UnitEmployee;
  }

  checkInitiativesStageStatus() {
    if (!this.planId) return;

    this.planStatusService.getPlanStatus(this.planId).subscribe({
      next: (planStatus) => {
        this.isInitiativesStageActive = planStatus.initiativesStage;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching plan status:', error);
        this.isInitiativesStageActive = false;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Initialize component data by loading plan status first, then objectives
   */
  private initializeData(): void {
    if (!this.planId) {
      console.error('Plan ID not available');
      return;
    }

    // First, get the plan status
    this.getPlanStatus();

    // Also check initiatives stage status
    this.checkInitiativesStageStatus();
  }

  /**
   * Check if all objectives and their items have been acted upon by the current manager
   * Two-level approval system:
   * 1. Goal level: Each goal must have ONE action (approve/reject/return)
   * 2. Goal items level: Each item within goal (name, description, indicator) must be acted upon
   * @returns boolean indicating if all goals and items have been processed by current manager
   */
  allObjectivesActedUpon(): boolean {
    const userRole = this.authService.getUserRole();
    const objectives = this.ObjectivesList();

    if (!objectives || objectives.length === 0) {
      return false; // No objectives to act upon
    }

    // Check each objective (goal level + items level)
    const allActedUpon = objectives.every((objective) => {
      // 1. Check goal-level approval
      const goalActedUpon = this.isGoalActedUponByRole(
        objective.status,
        userRole
      );

      // 2. Check goal items approval (name, description, indicator)
      const itemsActedUpon = this.areGoalItemsActedUponByRole(
        objective,
        userRole
      );

      const goalComplete = goalActedUpon && itemsActedUpon;

      return goalComplete;
    });

    return allActedUpon;
  }

  /**
   * Check if a goal has been acted upon by the specified role
   * @param goalStatus The status of the goal
   * @param userRole The role to check against
   */
  private isGoalActedUponByRole(
    goalStatus: string,
    userRole: string | null
  ): boolean {
    if (!userRole) return false;

    // For Unit Managers: Goal should be approved (fully or partially), rejected, or returned by Unit Manager
    if (userRole === RolesEnums.UnitManager) {
      return (
        goalStatus === ApprovalStatusEnum.ApprovedByUnitManager ||
        goalStatus === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
        goalStatus === ApprovalStatusEnum.RejectedByUnitManager ||
        goalStatus === ApprovalStatusEnum.ReturnedByUnitManager
      );
    }

    // For Region Managers: Goal should be approved (fully or partially), rejected, or returned by Region Manager
    if (userRole === RolesEnums.RegionManager) {
      return (
        goalStatus === ApprovalStatusEnum.ApprovedByRegionManager ||
        goalStatus === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
        goalStatus === ApprovalStatusEnum.RejectedByRegionManager ||
        goalStatus === ApprovalStatusEnum.ReturnedByRegionManager
      );
    }

    // For High Management: Goal should be approved (fully or partially), rejected, or returned by High Management
    if (userRole === RolesEnums.HighManagement) {
      return (
        goalStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        goalStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially ||
        goalStatus === ApprovalStatusEnum.RejectedByHighManagement ||
        goalStatus === ApprovalStatusEnum.ReturnedByHighManagement
      );
    }

    return false;
  }

  /**
   * Check if all items within a goal have been acted upon by the specified role
   * @param goal The goal object containing items
   * @param userRole The role to check against
   */
  private areGoalItemsActedUponByRole(
    goal: any,
    userRole: string | null
  ): boolean {
    if (!userRole) return false;

    // Helper function to check if an item has been acted upon by the role
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

    // Check each required item
    const nameActedUpon = isItemActedUpon(goal.name);
    const descriptionActedUpon = isItemActedUpon(goal.descripition);
    const indicatorActedUpon = isItemActedUpon(goal.indicator);

    const allItemsActedUpon =
      nameActedUpon && descriptionActedUpon && indicatorActedUpon;

    // Only log if debugging is enabled or if there's an issue
    if (!allItemsActedUpon) {
      console.log(`Goal ${goal.id} items incomplete:`, {
        name: {
          value: goal.name?.value,
          status: goal.name?.status,
          actedUpon: nameActedUpon,
        },
        description: {
          value: goal.descripition?.value,
          status: goal.descripition?.status,
          actedUpon: descriptionActedUpon,
        },
        indicator: {
          value: goal.indicator?.value,
          status: goal.indicator?.status,
          actedUpon: indicatorActedUpon,
        },
        userRole,
        allItemsActedUpon,
      });
    }

    return allItemsActedUpon;
  }

  /**
   * Legacy method - now handled by ObjectivesStatusService
   * @deprecated Use ObjectivesStatusService instead
   */
  calculateSubmissionButtonVisibility() {
    // This method is now handled by the status service through reactive effects
    // Keeping for backward compatibility but functionality moved to service
  }

  /**
   * Check if the current user can approve the stage based on their role and current stage status
   */
  canApproveStageBasedOnRole(): boolean {
    const userRole = this.authService.getUserRole();
    const stageStatus = this.planGoalStatus();

    // Unit Manager can approve when stage is Pending
    if (userRole === RolesEnums.UnitManager) {
      return stageStatus === ApprovalStatusEnum.Pending;
    }

    // Region Manager can approve when stage is approved (fully or partially) by Unit Manager
    if (userRole === RolesEnums.RegionManager) {
      return (
        stageStatus === ApprovalStatusEnum.ApprovedByUnitManager ||
        stageStatus === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      );
    }

    // High Management can approve when stage is approved (fully or partially) by Region Manager
    if (userRole === RolesEnums.HighManagement) {
      return (
        stageStatus === ApprovalStatusEnum.ApprovedByRegionManager ||
        stageStatus === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      );
    }

    return false;
  }

  /**
   * Check if user can take action on goal items (name, description, indicator)
   * This is used in the details modal for individual item approvals.
   * Same ladder as the goal itself: an item already approved at this level or
   * above needs nothing more from this role.
   * @param itemStatus The status of the specific item within a goal
   */
  canTakeActionOnGoalItem(itemStatus: string): boolean {
    return this.objectivesStatusService.canActOn(itemStatus);
  }

  /**
   * Method to be bound to the details component for checking goal item permissions
   * @param itemStatus The status of the goal item
   */
  canTakeActionOnItem = (itemStatus: string): boolean => {
    return this.canTakeActionOnGoalItem(itemStatus);
  };

  /**
   * Check if a goal can be approved by the current user (with caching)
   * This validates that all items within the goal have been acted upon
   * @param goal The goal to check
   */
  canApproveGoal(goal: any): boolean {
    if (!goal || !goal.id) return false;

    const cacheKey = `${goal.id}_${this.authService.getUserRole()}`;
    const cached = this.goalValidationCache.get(cacheKey);
    const now = Date.now();

    // Return cached result if still valid
    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.canApprove;
    }

    // First check if user can take action on this goal
    if (!this.canTakeAction(goal.status)) {
      this.goalValidationCache.set(cacheKey, {
        canApprove: false,
        message: null,
        timestamp: now,
      });
      return false;
    }

    // Every item has to be approved at this role's level or above. An item
    // approved higher up before the goal was reworked keeps that approval;
    // requiring this role's own status on it is what stranded reworked goals
    // as «غير مكتمل» for the unit manager.
    const canApprove = this.objectivesStatusService.areGoalItemsApprovedByMe(goal);
    const message = canApprove
      ? null
      : 'يجب اتخاذ إجراء على جميع عناصر الهدف (الاسم، الوصف، المؤشر) قبل الموافقة على الهدف';

    // Cache the result
    this.goalValidationCache.set(cacheKey, {
      canApprove,
      message,
      timestamp: now,
    });

    return canApprove;
  }

  /**
   * Get validation message for goal approval (with caching)
   * Returns message if goal cannot be approved, null if it can be approved
   * @param goal The goal to check
   */
  getGoalApprovalValidationMessage(goal: any): string | null {
    if (!goal || !goal.id) return null;

    const cacheKey = `${goal.id}_${this.authService.getUserRole()}`;
    const cached = this.goalValidationCache.get(cacheKey);
    const now = Date.now();

    // Return cached result if still valid
    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.message;
    }

    // Trigger validation which will update cache
    this.canApproveGoal(goal);

    // Return from cache
    const updated = this.goalValidationCache.get(cacheKey);
    return updated ? updated.message : null;
  }

  /**
   * Clear validation cache (call after data updates)
   */
  private clearValidationCache(): void {
    this.goalValidationCache.clear();
  }

  /**
   * Handle when an item action is taken in the details modal
   * This clears the validation cache, reloads data, and updates the status service
   */
  onItemActionTaken(): void {
    console.log(
      'Item action taken, refreshing data and clearing validation cache'
    );
    this.clearValidationCache();

    // Reload the objectives data to get the latest status updates
    this.loadObjectives();

    // Also update the details modal with fresh data if it's open
    if (this.showObjectiveDetailsModal && this.objectiveId) {
      this.viewObjective();
    }
  }

  /**
   * Get descriptive text for the submission button based on user role
   */
  getSubmissionButtonText(): string {
    const userRole = this.authService.getUserRole();

    if (userRole === RolesEnums.UnitManager) {
      return 'إرسال إلى مدير المنطقة';
    } else if (userRole === RolesEnums.RegionManager) {
      return 'إرسال إلى الإدارة العليا';
    } else if (userRole === RolesEnums.HighManagement) {
      return 'الموافقة النهائية';
    }

    return 'تأكيد';
  }

  /**
   * Get current stage status hint text
   */
  getCurrentStageHint(): string {
    const stageStatus = this.planGoalStatus();

    switch (stageStatus) {
      case ApprovalStatusEnum.Pending:
        return 'المرحلة الحالية: في انتظار موافقة مدير الوحدة';
      case ApprovalStatusEnum.ApprovedByUnitManager:
      case ApprovalStatusEnum.ApprovedByUnitManagerPartially:
        return 'المرحلة الحالية: في انتظار موافقة مدير المنطقة';
      case ApprovalStatusEnum.ApprovedByRegionManager:
      case ApprovalStatusEnum.ApprovedByRegionManagerPartially:
        return 'المرحلة الحالية: في انتظار موافقة الإدارة العليا';
      case ApprovalStatusEnum.ApprovedByHighManagement:
        return 'تم اعتماد المرحلة بالكامل';
      case ApprovalStatusEnum.RejectedByUnitManager:
        return 'المرحلة: مرفوضة من مدير الوحدة';
      case ApprovalStatusEnum.RejectedByRegionManager:
        return 'المرحلة: مرفوضة من مدير المنطقة';
      case ApprovalStatusEnum.RejectedByHighManagement:
        return 'المرحلة: مرفوضة من الإدارة العليا';
      case ApprovalStatusEnum.ReturnedByUnitManager:
        return 'المرحلة: مُرجعة من مدير الوحدة';
      case ApprovalStatusEnum.ReturnedByRegionManager:
        return 'المرحلة: مُرجعة من مدير المنطقة';
      case ApprovalStatusEnum.ReturnedByHighManagement:
        return 'المرحلة: مُرجعة من الإدارة العليا';
      default:
        return 'المرحلة الحالية: غير محددة';
    }
  }

  canEditGoal(goal: any): boolean {
    if (!goal) return false;
    if (this.authService.getUserRole() !== RolesEnums.UnitEmployee) return false;

    // Editable while the goal is not yet approved at any level.
    // Once approved it is locked; a reject/return reopens it until final approval.
    const isDraft = goal.status === ApprovalStatusEnum.SavedAsDraft;
    const isPending = PendingStatuses.includes(goal.status);
    const isReturned = ReturnedStatuses.includes(goal.status);
    const isRejected = RejectionStatuses.includes(goal.status);

    return isDraft || isPending || isReturned || isRejected;
  }

  canDeleteGoal(goal: any): boolean {
    return this.permissionsService.canDeleteItem('Goals', goal);
  }

  /**
   * Check if Unit Manager has taken any action on a goal or its items
   * @param goal The goal to check
   */
  private hasUnitManagerActedOnGoal(goal: any): boolean {
    if (!goal) return false;

    // Check if Unit Manager has acted on the goal itself
    const goalActedUpon =
      goal.status === ApprovalStatusEnum.ApprovedByUnitManager ||
      goal.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
      goal.status === ApprovalStatusEnum.RejectedByUnitManager ||
      goal.status === ApprovalStatusEnum.ReturnedByUnitManager;

    // Check if Unit Manager has acted on any of the goal items
    const nameActedUpon =
      goal.name?.status &&
      (goal.name.status === ApprovalStatusEnum.ApprovedByUnitManager ||
        goal.name.status ===
          ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
        goal.name.status === ApprovalStatusEnum.RejectedByUnitManager ||
        goal.name.status === ApprovalStatusEnum.ReturnedByUnitManager);

    const descriptionActedUpon =
      goal.descripition?.status &&
      (goal.descripition.status === ApprovalStatusEnum.ApprovedByUnitManager ||
        goal.descripition.status ===
          ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
        goal.descripition.status === ApprovalStatusEnum.RejectedByUnitManager ||
        goal.descripition.status === ApprovalStatusEnum.ReturnedByUnitManager);

    const indicatorActedUpon =
      goal.indicator?.status &&
      (goal.indicator.status === ApprovalStatusEnum.ApprovedByUnitManager ||
        goal.indicator.status ===
          ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
        goal.indicator.status === ApprovalStatusEnum.RejectedByUnitManager ||
        goal.indicator.status === ApprovalStatusEnum.ReturnedByUnitManager);

    // Return true if Unit Manager has acted on goal or any of its items
    return (
      goalActedUpon ||
      nameActedUpon ||
      descriptionActedUpon ||
      indicatorActedUpon
    );
  }

  /**
   * Check if a goal has any items still in returned status
   * @param goal The goal to check
   */
  private hasAnyReturnedItems(goal: any): boolean {
    if (!goal) return false;

    const isEditable = (status: any): boolean =>
      ReturnedStatuses.includes(status) || RejectionStatuses.includes(status);

    // Check if the goal itself is returned or rejected (employee can edit)
    if (isEditable(goal.status)) {
      return true;
    }

    // Check if any of the goal items are still in returned/rejected status
    const nameReturned = goal.name?.status && isEditable(goal.name.status);
    const descriptionReturned =
      goal.descripition?.status && isEditable(goal.descripition.status);
    const indicatorReturned =
      goal.indicator?.status && isEditable(goal.indicator.status);

    return nameReturned || descriptionReturned || indicatorReturned;
  }

  /**
   * Apply filters to objectives list
   */
  applyFilters(): void {
    const objectives = this.ObjectivesList();
    let filtered = [...objectives];

    // Filter by status
    if (this.filterStatus) {
      filtered = filtered.filter((obj) => obj.status === this.filterStatus);
    }

    // Filter by unit
    if (this.filterUnit) {
      filtered = filtered.filter((obj) => obj.unitName === this.filterUnit);
    }

    this.filteredObjectivesList.set(filtered);
    console.log('Applied filters:', {
      filterStatus: this.filterStatus,
      filterUnit: this.filterUnit,
    });
    console.log(
      'Filtered results:',
      filtered.length,
      'out of',
      objectives.length
    );
  }

  /**
   * Extract available filter options from objectives data
   */
  private extractFilterOptions(): void {
    const objectives = this.ObjectivesList();

    // Set all possible statuses
    const statuses = [
      ApprovalStatusEnum.Pending,
      ApprovalStatusEnum.SavedAsDraft,
      ApprovalStatusEnum.ApprovedByUnitManager,
      ApprovalStatusEnum.ApprovedByUnitManagerPartially,
      ApprovalStatusEnum.ReturnedByUnitManager,
      ApprovalStatusEnum.RejectedByUnitManager,
      ApprovalStatusEnum.ApprovedByRegionManager,
      ApprovalStatusEnum.ApprovedByRegionManagerPartially,
      ApprovalStatusEnum.ReturnedByRegionManager,
      ApprovalStatusEnum.RejectedByRegionManager,
      ApprovalStatusEnum.ApprovedByHighManagement,
      ApprovalStatusEnum.ApprovedByHighManagementPartially,
      ApprovalStatusEnum.ReturnedByHighManagement,
      ApprovalStatusEnum.RejectedByHighManagement,
    ];
    this.availableStatuses.set(statuses);

    // Extract unique unit names
    const units = [
      ...new Set(objectives.map((obj) => obj.unitName).filter(Boolean)),
    ];
    this.availableUnits.set(units);

    console.log('Available filter options:', { statuses, units });
  }

  /**
   * Handle status filter change
   */
  onStatusFilterChange(status: string): void {
    this.filterStatus = status;
    this.applyFilters();
  }

  /**
   * Handle unit filter change
   */
  onUnitFilterChange(unit: string): void {
    this.filterUnit = unit;
    this.applyFilters();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterStatus = '';
    this.filterUnit = '';
    this.applyFilters();
  }

  /**
   * Get user-friendly status name for display
   */
  getStatusDisplayName(status: string): string {
    switch (status) {
      case ApprovalStatusEnum.Pending:
        return 'في انتظار الموافقة';
      case ApprovalStatusEnum.ApprovedByUnitManager:
        return 'موافق عليه من مدير الوحدة';
      case ApprovalStatusEnum.ApprovedByUnitManagerPartially:
        return 'موافق عليه من مدير الوحدة';
      case ApprovalStatusEnum.ApprovedByRegionManager:
        return 'موافق عليه من مدير المنطقة';
      case ApprovalStatusEnum.ApprovedByRegionManagerPartially:
        return 'موافق عليه من مدير المنطقة';
      case ApprovalStatusEnum.ApprovedByHighManagement:
        return 'موافق عليه من الإدارة العليا';
      case ApprovalStatusEnum.ApprovedByHighManagementPartially:
        return 'موافق عليه من الإدارة العليا';
      case ApprovalStatusEnum.RejectedByUnitManager:
        return 'مرفوض من مدير الوحدة';
      case ApprovalStatusEnum.RejectedByRegionManager:
        return 'مرفوض من مدير المنطقة';
      case ApprovalStatusEnum.RejectedByHighManagement:
        return 'مرفوض من الإدارة العليا';
      case ApprovalStatusEnum.ReturnedByUnitManager:
        return 'مُرجع من مدير الوحدة';
      case ApprovalStatusEnum.ReturnedByRegionManager:
        return 'مُرجع من مدير المنطقة';
      case ApprovalStatusEnum.ReturnedByHighManagement:
        return 'مُرجع من الإدارة العليا';
      case ApprovalStatusEnum.SavedAsDraft:
        return 'مسودة';
      default:
        return status;
    }
  }

  /**
   * Check if an objective is in returned status
   */
  isReturnedObjective(objective: any): boolean {
    if (!objective) return false;

    // Check if the objective itself is returned
    if (ReturnedStatuses.includes(objective.status)) {
      return true;
    }

    // Check if any of the objective items are returned
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

  /**
   * Get message for returned objectives
   */
  getReturnedObjectiveMessage(): string {
    const userRole = this.authService.getUserRole();

    if (userRole === RolesEnums.UnitEmployee) {
      return 'تم إرجاع هذا الهدف، يرجى مراجعته وتعديله حسب التعليقات';
    }

    return 'تم إرجاع هذا الهدف، في انتظار التعديل من موظف الوحدة';
  }
  generatePDF(): void {
  const planId = Number(this.route.snapshot.paramMap.get('planId'));

  if (!planId || isNaN(planId)) {
    console.error('planId غير موجود أو غير صحيح');
    return;
  }

  this.pdf.getPdfforgoal(planId).subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    },
    error: (err) => {
      console.error('حصل خطأ أثناء تحميل الـ PDF', err);
    }
  });
}
Approve(): void {
  const planId = Number(this.route.snapshot.paramMap.get('planId'));

  if (!planId || isNaN(planId)) {
    console.error('planId غير موجود أو غير صحيح');
    return;
  }

  this.app.ApproveGoal(planId).subscribe({
    next: (blob) => {
      window.location.reload();
    },
    error: (err) => {
      console.error('حصل خطأ أثناء تحميل الـ PDF', err);
    }
  });
}

}
