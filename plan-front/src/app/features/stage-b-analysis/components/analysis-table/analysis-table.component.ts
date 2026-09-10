import { PdfService } from './../../../../pdf.service';
import { NgIf } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalysisStageService } from '../../services/analysis-stage.service';
import { AuthService } from '../../../auth/services/auth.service';
import { SharedDataService } from '../../../../Core/Service/shared-data.service';
import {
  ApprovalStatusEnum,
  PendingStatuses,
  RejectionStatuses,
  ReturnedStatuses,
  RolesEnums,
} from '../../../../Core/utilities/consts';
import { AnalysisTypes } from '../../../../Core/utilities/global.type';
import { isActionAlreadyTakenByTheCurrentManager } from '../../../../Core/utilities/utils';
import { ActionsAdminComponent } from '../../../../shared/components/app-admin-actions/app-admin-actions.component';
import { CommentModalComponent } from '../../../../shared/components/comment-form/app-comment-form.component';
import { PopupComponent } from '../../../../shared/components/popup/popup.component';
import { StatusActionComponent } from '../../../../shared/components/status-action/status.component';
import { PlanStatusService } from '../../services/PlanStatus.service';
import { AnalysisFormComponent } from '../analysis-form/analysis-form.component';
import { AnalysisStatusService } from '../../services/analysis-status.service';
import { SavePopupComponent } from "../../../../save-popup/save-popup.component";
@Component({
  selector: 'app-analysis-table',
  standalone: true,
  imports: [
    AnalysisFormComponent,
    PopupComponent,
    ActionsAdminComponent,
    CommentModalComponent,
    NgIf,
    StatusActionComponent,
    
],
  templateUrl: './analysis-table.component.html',
  styleUrl: './analysis-table.component.css',
})
export class AnalysisTableComponent implements OnInit, OnDestroy {
  @Input() columns: {
    key: string;
    label: string;
    width: string;
  }[] = [
    { key: 'name', label: 'اسم النقطة', width: '15vw' },
    { key: 'procedures', label: 'الاجراءات المتخذ حيالها', width: '35vw' },
  ];

  private analysisStageService = inject(AnalysisStageService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private planStatusService = inject(PlanStatusService);
  public sharedDataService = inject(SharedDataService);
  private readonly analysisStatusService = inject(AnalysisStatusService);
  showFormPopup = true;      // يتحكم في الفورم
  showConfirmPopup = true;  // يتحكم في Popup التأكيد

  data = signal<any[]>([]);
  @Input() type!: AnalysisTypes;
  @Input() set planId(id: string) {
    if (id) {
      this._planId = id;
      this.unitId = this.sharedDataService.getAnalysisData()?.unitId;
      this.getAnalysisData(this.unitId);
    }
  }

  onFormClosed(success: boolean) {
    this.showFormPopup = false; // اقفل الفورم

    if (success) {
      // افتح Popup التأكيد بعد ما الفورم يقفل
      this.showConfirmPopup = true;

      // اقفله لوحده بعد ثانيتين
      setTimeout(() => {
        this.showConfirmPopup = false;
      }, 2000);
    }
  }

  get planId(): string {
    return this._planId || this.planStatusService.planId();
  }
  private _planId = '';

  @Input() set isAnalysisApproved(value: boolean) {
    this._isAnalysisApproved = value;
  }
  get isAnalysisApproved(): boolean {
    // Use the value from signal service rather than older planStatusService
    const approved =
      this._isAnalysisApproved !== undefined
        ? this._isAnalysisApproved
        : this.analysisStatusService.isAnalysisApproved();

    return approved;
  }
  private _isAnalysisApproved?: boolean;

  @Input() showActions = false;
  @Input() showCreateButton = false;
  @Input() createButtonText = '';

  @Output() actionSelected = new EventEmitter<{ action: string; item: any }>();
  @Output() createNew = new EventEmitter<void>();

  showCommentModal = false;
  popupVisibleMode: 'view' | 'create' | 'edit' | null = null;
  editSelectedItem: any = null;
  isActionPopupVisible = false;
  isNotAllowUseAction = false;
  showPriorityColumns = false;
  reasonModalType: 'reject' | 'return' | null = null;
  unitId: any = null;
  isLoading = false;

  // Add delete confirmation modal properties
  showDeleteConfirmationModal = false;
  itemToDelete: any = null;
  isDeleting = false;

  // Store the effect reference to properly clean it up
  private planStatusEffect = effect(
    () => {
      const status = this.planStatusService.planStatus();
      if (status) {
        this.getAnalysisData(this.unitId);
      }
    },
    { allowSignalWrites: true }
  );

  hasAddPermission = computed(() => {
    // Get the current user's role
    const userRole = this.authService.getUserRole();

    // If analysis is already approved by High Management, no one can add new points
    if (this.isAnalysisApproved) {
      return false;
    }

    // Additional check for high management approval directly from stage status
    const stageStatus = this.analysisStatusService.stageStatus();
    if (
      stageStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
      stageStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially
    ) {
      return false;
    }

    // All can add new points if not in final approved state
    return (
      userRole === RolesEnums.UnitEmployee ||
      userRole === RolesEnums.HighManagement ||
      userRole === RolesEnums.RegionManager ||
      userRole === RolesEnums.UnitManager
    );
  });

  // Add a new property to store the ID separately
  private selectedPointId: any = null;

  constructor(    private pdfService: PdfService
) {
    // Constructor is an injection context, so effects can be created here

    // Create an effect to update when isAnalysisApproved changes in the service
    effect(() => {
      const isApproved = this.analysisStatusService.isAnalysisApproved();

      // If we detect analysis is approved, force UI update
      if (isApproved) {
        // Schedule a refresh of the data to apply restrictions
        setTimeout(() => {
          if (this.unitId && this.planId) {
            this.getAnalysisData(this.unitId);
          }
        }, 0);
      }
    });
  }

  ngOnInit(): void {
    // If planId wasn't set directly, get it from the route
    if (!this._planId) {
      const routePlanId = this.route.snapshot.paramMap.get('planId');
      if (routePlanId) {
        this._planId = routePlanId;

        // If the service doesn't have the planId yet, set it
        if (!this.planStatusService.planId()) {
          this.planStatusService.setPlanId(routePlanId);
        }
      }
    }

    this.showPriorityColumns =
      this.router.url.endsWith('/Priorities') ||
      this.router.url.endsWith('/FinalAnalysis');

    this.unitId = this.sharedDataService.getAnalysisData()?.unitId;

    // Initial data load
    this.getAnalysisData(this.unitId);
  }

  ngOnDestroy(): void {
    // Clean up the effect when component is destroyed
    if (this.planStatusEffect) {
      this.planStatusEffect.destroy();
    }
  }

  isActionAlreadyTakenByTheCurrentManager(status: string) {
    const userRole = this.authService.getUserRole();
    return isActionAlreadyTakenByTheCurrentManager(status, userRole!);
  }

  getAnalysisData(unitId: null | string) {
    if (!this.planId) return;

    const params: Record<string, any> = { type: this.type };
    if (unitId) {
      params['Unit'] = unitId;
    }

    this.analysisStageService
      .getAnalysisStageLists(this.planId, params)
      .subscribe({
        next: (res) => {
          this.data.set(res.data);
        },
        error: (err) => {
          console.error(`Error loading ${this.type} data:`, err);
        },
      });
  }

  toggleFormModel(target: 'view' | 'create' | 'edit' | null) {
    this.popupVisibleMode = target;
  }

  closePopup(event: boolean) {
    if (event) {
      this.getAnalysisData(this.unitId);
    }
    this.toggleFormModel(null);
  }

  handleDeleteItem() {
    if (!this.editSelectedItem || !this.planId || this.isDeleting) {
      return;
    }

    this.isDeleting = true;

    this.analysisStageService
      .deleteAnalysisPoint({
        id: this.editSelectedItem?.id,
        planId: this.planId,
      })
      .subscribe({
        next: () => {
          this.getAnalysisData(this.unitId);
          this.closeDeleteConfirmationModal();
          this.isDeleting = false;
        },
        error: (err) => {
          console.error('Error deleting analysis point:', err);
          this.closeDeleteConfirmationModal();
          this.isDeleting = false;
        },
      });
  }

  // New methods for delete confirmation
  showDeleteConfirmation(item: any) {
    this.itemToDelete = item;
    this.showDeleteConfirmationModal = true;
  }

  closeDeleteConfirmationModal() {
    this.showDeleteConfirmationModal = false;
    this.itemToDelete = null;
    this.isDeleting = false;
  }

  confirmDelete() {
    if (this.itemToDelete && !this.isDeleting) {
      this.editSelectedItem = this.itemToDelete;
      this.handleDeleteItem();
    }
  }

  // Update signal state directly without making additional API calls
  private updateLocalPointStatus(
    pointId: any,
    newStatus: ApprovalStatusEnum
  ): void {
    // Update the service's signal state directly
    this.analysisStatusService.updatePointStatus(pointId, newStatus);

    // Also update the local data signal to keep UI in sync
    const currentPoints = this.data();
    if (currentPoints.length) {
      const updatedPoints = currentPoints.map((point) =>
        point.id === pointId ? { ...point, status: newStatus } : point
      );
      this.data.set(updatedPoints);
    }
  }

  handleAccept(item: any) {
    if (!item || !item.id) return;

    this.isLoading = true; // Add loading state
    const pointId = item.id; // Store ID locally for safety

    this.analysisStageService
      .approveAnalysisPoint(this.planId, pointId)
      .subscribe({
        next: () => {
          // Determine new status based on user role
          const userRole = this.authService.getUserRole();
          let newStatus: ApprovalStatusEnum;

          if (userRole === RolesEnums.UnitManager) {
            newStatus = ApprovalStatusEnum.ApprovedByUnitManager;
          } else if (userRole === RolesEnums.RegionManager) {
            newStatus = ApprovalStatusEnum.ApprovedByRegionManager;
          } else if (userRole === RolesEnums.HighManagement) {
            newStatus = ApprovalStatusEnum.ApprovedByHighManagement;
          } else {
            // Default fallback - should not happen
            newStatus = ApprovalStatusEnum.Pending;
          }

          // Update local data
          this.updateLocalPointStatus(pointId, newStatus);

          // Broadcast change to update button visibility
          this.broadcastPointStatusChange();

          // Also get fresh data from server (but don't block UI update)
          this.getAnalysisData(this.unitId);

          this.isLoading = false; // Reset loading state
        },
        error: (err) => {
          console.error('Error approving analysis point:', err);
          this.isLoading = false; // Reset loading state even on error
        },
      });
  }

  handleReject(item: any) {
    if (!item || !item.id) return;

    this.editSelectedItem = item;
    this.selectedPointId = item.id; // Store ID separately
    this.showCommentModal = true;
    this.reasonModalType = 'reject';
  }

  handleReturn(item: any) {
    if (!item || !item.id) return;

    this.editSelectedItem = item;
    this.selectedPointId = item.id; // Store ID separately
    this.showCommentModal = true;
    this.reasonModalType = 'return';
  }

  handleOptionSelected(option: any): void {
    this.editSelectedItem = option.item;

    // Convert type to lowercase for case-insensitive comparison
    const optionType = option.type.toLowerCase();

    switch (optionType) {
      case 'view':
        this.toggleFormModel('view');
        break;
      case 'edit':
        this.toggleFormModel('edit');
        break;
      case 'delete':
        this.showDeleteConfirmation(option.item);
        break;
    }
    this.isActionPopupVisible = false;
  }

  toggleActionPopup(item: any) {
    this.isActionPopupVisible = !this.isActionPopupVisible;
    if (this.isActionPopupVisible) {
      this.editSelectedItem = item;
    } else {
      this.editSelectedItem = null;
    }
  }

  handleRestore(reason: string) {
    if (!this.planId) return;

    // Use the separately stored ID that won't be nullified
    const pointId = this.selectedPointId;
    if (!pointId) {
      console.error('No point ID available for action');
      return;
    }

    // Determine user role for setting the appropriate status
    const userRole = this.authService.getUserRole();
    let newStatus: ApprovalStatusEnum;

    if (this.reasonModalType === 'return') {
      // Set the appropriate return status based on role
      if (userRole === RolesEnums.UnitManager) {
        newStatus = ApprovalStatusEnum.ReturnedByUnitManager;
      } else if (userRole === RolesEnums.RegionManager) {
        newStatus = ApprovalStatusEnum.ReturnedByRegionManager;
      } else if (userRole === RolesEnums.HighManagement) {
        newStatus = ApprovalStatusEnum.ReturnedByHighManagement;
      } else {
        // Default fallback
        newStatus = ApprovalStatusEnum.Pending;
      }

      this.analysisStageService
        .returnAnalysisPoint(this.planId, pointId, reason)
        .subscribe({
          next: () => {
            // Update local data immediately for reactive UI
            this.updateLocalPointStatus(pointId, newStatus);

            // Broadcast change to update button visibility
            this.broadcastPointStatusChange();

            // Reset UI state
            this.editSelectedItem = null;
            this.selectedPointId = null;
            this.reasonModalType = null;
            this.showCommentModal = false;

            // Also fetch updated data from server (but don't block UI update)
            this.getAnalysisData(this.unitId);
          },
          error: (err) => {
            console.error('Error returning analysis point:', err);
          },
        });
    } else if (this.reasonModalType === 'reject') {
      // Set the appropriate reject status based on role
      if (userRole === RolesEnums.UnitManager) {
        newStatus = ApprovalStatusEnum.RejectedByUnitManager;
      } else if (userRole === RolesEnums.RegionManager) {
        newStatus = ApprovalStatusEnum.RejectedByRegionManager;
      } else if (userRole === RolesEnums.HighManagement) {
        newStatus = ApprovalStatusEnum.RejectedByHighManagement;
      } else {
        // Default fallback
        newStatus = ApprovalStatusEnum.Pending;
      }

      this.analysisStageService
        .rejectAnalysisPoint(this.planId, pointId, reason)
        .subscribe({
          next: () => {
            // Update local data immediately for reactive UI
            this.updateLocalPointStatus(pointId, newStatus);

            // Broadcast change to update button visibility
            this.broadcastPointStatusChange();

            // Reset UI state
            this.reasonModalType = null;
            this.editSelectedItem = null;
            this.selectedPointId = null;
            this.showCommentModal = false;

            // Also fetch updated data from server (but don't block UI update)
            this.getAnalysisData(this.unitId);
          },
          error: (err) => {
            console.error('Error rejecting analysis point:', err);
          },
        });
    }
  }

  /**
   * Check if user can edit an analysis item
   * According to workflow:
   * - Unit Employees can edit points that are:
   *   1. In Pending status
   *   2. Have been returned by Region Manager or High Management
   *   (Cannot edit rejected points)
   * - No one can edit after final approval by High Management
   * @param item Analysis item to check
   */
  canEditItem(item: any): boolean {
    const userRole = this.authService.getUserRole();

    // Only unit employees can edit
    if (userRole !== RolesEnums.UnitEmployee) return false;

    // Editable while the item is not yet approved at any level.
    // Once approved it is locked; a reject/return reopens it until final approval.
    const isDraft = item.status === ApprovalStatusEnum.SavedAsDraft;
    const isPending = PendingStatuses.includes(item.status);
    const isReturned = ReturnedStatuses.includes(item.status);
    const isRejected = RejectionStatuses.includes(item.status);

    return isDraft || isPending || isReturned || isRejected;
  }

  /**
   * Check if user can delete an analysis item
   * Unit employees can delete any pending items
   * @param item Analysis item to check
   */
  canDeleteItem(item: any): boolean {
    const userRole = this.authService.getUserRole();

    // Only unit employees can delete items
    if (userRole !== RolesEnums.UnitEmployee) return false;

    // Deletable while the item is not yet approved at any level (same rule as edit).
    const isDraft = item.status === ApprovalStatusEnum.SavedAsDraft;
    const isPending = PendingStatuses.includes(item.status);
    const isReturned = ReturnedStatuses.includes(item.status);
    const isRejected = RejectionStatuses.includes(item.status);

    return isDraft || isPending || isReturned || isRejected;
  }

  canTakeAction(item: any): boolean {
    // If analysis is already in final approved state, no actions can be taken
    if (this.isAnalysisApproved) {
      return false;
    }

    // Additional check for high management approval directly from stage status
    const stageStatus = this.analysisStatusService.stageStatus();
    if (
      stageStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
      stageStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially
    ) {
      return false;
    }

    const userRole = this.authService.getUserRole();
    // Region managers can take action on pending items for regional approval
    if (userRole === RolesEnums.UnitManager) {
      // Assuming this is a valid enum value in your actual code
      return item.status === ApprovalStatusEnum.Pending;
    }

    // Region managers can take action on pending items for regional approval
    if (userRole === RolesEnums.RegionManager) {
      // Assuming this is a valid enum value in your actual code
      return (
        item.status === ApprovalStatusEnum.Pending ||
        item.status === ApprovalStatusEnum.ApprovedByUnitManager
      );
    }

    // High management can take action on items pending high approval
    if (userRole === RolesEnums.HighManagement) {
      // Assuming this is a valid enum value in your actual code
      return item.status === ApprovalStatusEnum.ApprovedByRegionManager;
    }

    return false;
  }

  handleCommentModalClosed(): void {
    this.showCommentModal = false;
    this.editSelectedItem = null;
    this.selectedPointId = null;
    this.reasonModalType = null;
  }

  handleReasonSubmitted(reason: string): void {
    this.handleRestore(reason);
    this.showCommentModal = false;
  }

  getUserRole(): string {
    return this.authService.getUserRole() || '';
  }

  // Broadcast status change to the service after point approval/rejection
  private broadcastPointStatusChange(): void {
    // Notify the service about the status change without triggering additional API calls
    this.analysisStatusService.pointStatusChanged();

    // For Unit Managers specifically, trigger immediate UI update
    // This is a workaround for reactivity issues with Unit Manager approval flow
    const userRole = this.authService.getUserRole();
    if (userRole === RolesEnums.UnitManager) {
      // Force a re-check of all points status
      setTimeout(() => {
        // Check if all points have been acted upon
        const currentPoints = this.data();

        // First check if there are any returned points - if so, can't approve yet
        const hasReturnedPoints = currentPoints.some(
          (p) => p.status === ApprovalStatusEnum.ReturnedByUnitManager
        );

        // Only consider points acted upon if all are approved/rejected and none are returned
        const allActedUpon =
          !hasReturnedPoints &&
          currentPoints.every(
            (p) =>
              p.status === ApprovalStatusEnum.ApprovedByUnitManager ||
              p.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
              p.status === ApprovalStatusEnum.RejectedByUnitManager
          );

        if (allActedUpon) {
          this.analysisStatusService.forceRefreshAndGetState();
        } else {
          console.log(
            '[AnalysisTableComponent] Not all points are acted upon or some are returned, button should not appear'
          );
        }
      }, 100);
    }
  }
}
