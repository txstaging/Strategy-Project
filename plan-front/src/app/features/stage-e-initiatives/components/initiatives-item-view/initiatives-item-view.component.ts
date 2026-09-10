import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ApprovalStatusEnum,
  PendingStatuses,
  RejectionStatuses,
  ReturnedStatuses,
  RolesEnums,
} from '../../../../Core/utilities/consts';
import { isActionAlreadyTakenByTheCurrentManager } from '../../../../Core/utilities/utils';
import { AuthService } from '../../../../features/auth/services/auth.service';
import { CommentModalComponent } from '../../../../shared/components/comment-form/app-comment-form.component';
import { StatusActionComponent } from '../../../../shared/components/status-action/status.component';
import { InitiativesStageHomeComponent } from '../../pages/initiatives-stage-home/initiatives-stage-home.component';
import { InitiativesService } from '../../services/initiatives.service';
import { InitiativesItemEditModalComponent } from '../initiatives-item-edit-modal/initiatives-item-edit-modal.component';
import { InitiativesItemViewModalComponent } from '../initiatives-item-view-modal/initiatives-item-view-modal.component';

@Component({
  selector: 'app-initiatives-item-view',
  standalone: true,
  imports: [
    InitiativesItemEditModalComponent,
    InitiativesItemViewModalComponent,
    StatusActionComponent,
    CommentModalComponent,
  ],
  templateUrl: './initiatives-item-view.component.html',
  styleUrl: './initiatives-item-view.component.css',
})
export class InitiativesItemViewComponent {
  @Input() detailsItem: any = {};
  @Input() index = 1;
  @Input() isAdmin = false;
  @Input() isInitiativesApproved = false;
  @Input() planId: any = null;
  @Input() isModal = false;

  @Output() closeModal = new EventEmitter<void>();

  showEditModal = false;
  showViewModal = false;
  showCommentModal = false;
  showDeleteModal = false;
  reasonModalType: 'reject' | 'return' | null = null;
  selectedInitiativeId: string | undefined;

  constructor(
    private authService: AuthService,
    private initiativesService: InitiativesService,
    private parentComponent: InitiativesStageHomeComponent
  ) {}

  openEditModal() {
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  openViewModal() {
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEditSubmitted(data: any) {
    // Handle the submitted data here
    this.closeEditModal();
    this.parentComponent.loadInitiatives();
  }

  isActionAlreadyTakenByTheCurrentManager(status: string) {
    const userRole = this.authService.getUserRole();
    return isActionAlreadyTakenByTheCurrentManager(status, userRole!);
  }

  /**
   * Checks if an employee can edit an initiative based on its status
   * According to workflow:
   * - Unit Employees can edit initiatives that are:
   *   1. In Pending status (not yet processed)
   *   2. In Returned status (need to be fixed based on feedback)
   *   (Cannot edit approved or rejected items)
   * @returns boolean indicating if the employee can edit the initiative
   */
  canEditBasedOnStatus(): boolean {
    // If detailsItem is null or doesn't have status, return false
    if (!this.detailsItem || !this.detailsItem.status) return false;

    // Get the current user role
    const userRole = this.authService.getUserRole();
    if (!userRole) return false;

    // If user is not an employee, this function is not relevant
    if (userRole !== RolesEnums.UnitEmployee) return false;

    // Check if item is in a valid status for editing
    const itemStatus = this.detailsItem.status as ApprovalStatusEnum;
    const isReturned = ReturnedStatuses.includes(itemStatus);
    const isRejected = RejectionStatuses.includes(itemStatus);
    const isDraft = itemStatus === ApprovalStatusEnum.SavedAsDraft;

    return isReturned || isRejected || isDraft;
  }

  /**
   * Check if user can take action on an initiative
   * According to workflow:
   * - Unit Employees add initiatives
   * - Unit Managers, Region Managers, and High Management can approve/reject/return individual initiatives
   */
  canTakeAction(): boolean {
    if (!this.detailsItem || !this.detailsItem.status) return false;

    const userRole = this.authService.getUserRole();
    const status = this.detailsItem.status;

    // Unit Managers can take action on initiatives in Pending status
    if (userRole === RolesEnums.UnitManager) {
      return status === ApprovalStatusEnum.Pending;
    }

    // Region Manager can take action on initiatives approved (fully or partially) by Unit Manager
    if (userRole === RolesEnums.RegionManager) {
      return (
        status === ApprovalStatusEnum.Pending ||
        status === ApprovalStatusEnum.ApprovedByUnitManager ||
        status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      );
    }

    // High Management can take action on initiatives approved (fully or partially) by Region Manager
    if (userRole === RolesEnums.HighManagement) {
      return (
        status === ApprovalStatusEnum.ApprovedByRegionManager ||
        status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      );
    }

    // Unit Employees cannot take actions on individual initiatives
    return false;
  }

  /**
   * Check if Unit Manager has taken any action on an initiative or its items
   */
  private hasUnitManagerActedOnInitiative(): boolean {
    if (!this.detailsItem) return false;

    // Check if Unit Manager has acted on the initiative itself
    const initiativeActedUpon =
      this.detailsItem.status === ApprovalStatusEnum.ApprovedByUnitManager ||
      this.detailsItem.status ===
        ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
      this.detailsItem.status === ApprovalStatusEnum.RejectedByUnitManager ||
      this.detailsItem.status === ApprovalStatusEnum.ReturnedByUnitManager;

    // Check if Unit Manager has acted on any of the initiative items
    const nameActedUpon =
      this.detailsItem.name?.status &&
      (this.detailsItem.name.status ===
        ApprovalStatusEnum.ApprovedByUnitManager ||
        this.detailsItem.name.status ===
          ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
        this.detailsItem.name.status ===
          ApprovalStatusEnum.RejectedByUnitManager ||
        this.detailsItem.name.status ===
          ApprovalStatusEnum.ReturnedByUnitManager);

    // Check KPIs
    const kpisActedUpon = this.detailsItem.initiativeKPIs?.some(
      (kpi: any) =>
        kpi.status === ApprovalStatusEnum.ApprovedByUnitManager ||
        kpi.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
        kpi.status === ApprovalStatusEnum.RejectedByUnitManager ||
        kpi.status === ApprovalStatusEnum.ReturnedByUnitManager
    );

    // Check initiative items
    const itemsActedUpon = this.detailsItem.initiativeItem?.some(
      (item: any) =>
        item.status === ApprovalStatusEnum.ApprovedByUnitManager ||
        item.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
        item.status === ApprovalStatusEnum.RejectedByUnitManager ||
        item.status === ApprovalStatusEnum.ReturnedByUnitManager
    );

    // Return true if Unit Manager has acted on initiative or any of its items
    return (
      initiativeActedUpon || nameActedUpon || kpisActedUpon || itemsActedUpon
    );
  }

  /**
   * Check if an initiative can be approved by the current user
   * This validates that all items within the initiative have been acted upon
   */
  canApproveInitiative(): boolean {
    if (!this.detailsItem || !this.detailsItem.id) return false;

    const userRole = this.authService.getUserRole();

    // First check if user can take action on this initiative
    if (!this.canTakeAction()) {
      return false;
    }

    // Check if all items within the initiative have been acted upon by current role
    return this.areInitiativeItemsActedUponByRole(userRole);
  }

  /**
   * Check if all items within an initiative have been acted upon by the specified role
   */
  private areInitiativeItemsActedUponByRole(userRole: string | null): boolean {
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
    const nameActedUpon = isItemActedUpon(this.detailsItem.name);

    // Check all KPIs
    const kpisActedUpon =
      this.detailsItem.initiativeKPIs?.every((kpi: any) =>
        isItemActedUpon(kpi)
      ) ?? true; // If no KPIs, consider as acted upon

    // Check all initiative items
    const itemsActedUpon =
      this.detailsItem.initiativeItem?.every((item: any) =>
        isItemActedUpon(item)
      ) ?? true; // If no items, consider as acted upon

    return nameActedUpon && kpisActedUpon && itemsActedUpon;
  }

  /**
   * Get validation message for initiative approval
   */
  getInitiativeApprovalValidationMessage(): string | null {
    if (this.canApproveInitiative()) {
      return null;
    }
    return 'يجب اتخاذ إجراء على جميع عناصر المبادرة (الاسم، المؤشرات، العناصر) قبل الموافقة على المبادرة';
  }

  handleAccept(item: any) {
    if (!item) return;
    this.initiativesService.approveInitiative(item.id).subscribe(() => {
      this.parentComponent.loadInitiatives();
    });
  }

  handleReject(item: any) {
    this.showCommentModal = true;
    this.selectedInitiativeId = item.id;
    this.reasonModalType = 'reject';
  }

  handleReturn(item: any) {
    this.showCommentModal = true;
    this.selectedInitiativeId = item.id;
    this.reasonModalType = 'return';
  }

  handleRestore(reason: string) {
    if (!this.selectedInitiativeId) return;

    if (this.reasonModalType === 'return') {
      this.initiativesService
        .returnInitiative(this.planId, this.selectedInitiativeId, reason)
        .subscribe(() => {
          this.parentComponent.loadInitiatives();
          this.selectedInitiativeId = undefined;
          this.reasonModalType = null;
        });
    } else if (this.reasonModalType === 'reject') {
      this.initiativesService
        .rejectInitiative(this.planId, this.selectedInitiativeId, reason)
        .subscribe(() => {
          this.parentComponent.loadInitiatives();
          this.selectedInitiativeId = undefined;
          this.reasonModalType = null;
        });
    }
  }

  deleteInitiative() {
    if (!this.detailsItem?.id) return;

    // Check permissions first.
    // Deletable while not yet approved; a reject/return reopens it.
    if (!this.canEditBasedOnStatus()) {
      alert('لا يمكن حذف المبادرة بعد اعتمادها');
      return;
    }

    // Show delete modal instead of browser confirm
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.detailsItem?.id) return;

    this.initiativesService.deleteInitiative(this.detailsItem.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.parentComponent.loadInitiatives();
      },
      error: (error) => {
        console.error('Error deleting initiative:', error);
        // You can show an error modal here instead of alert if needed
        alert('حدث خطأ أثناء حذف المبادرة');
        this.showDeleteModal = false;
      },
    });
  }

  cancelDelete() {
    this.showDeleteModal = false;
  }

  /**
   * Check if an initiative is in returned status
   */
  private isReturnedInitiative(): boolean {
    if (!this.detailsItem) return false;

    // Check if the initiative itself is returned
    if (ReturnedStatuses.includes(this.detailsItem.status)) {
      return true;
    }

    // Check if any of the initiative items are returned (for detailed data)
    if (this.detailsItem.name && typeof this.detailsItem.name === 'object') {
      // Check name
      if (
        this.detailsItem.name.status &&
        ReturnedStatuses.includes(this.detailsItem.name.status)
      ) {
        return true;
      }

      // Check KPIs
      if (
        this.detailsItem.initiativeKPIs?.some(
          (kpi: any) => kpi.status && ReturnedStatuses.includes(kpi.status)
        )
      ) {
        return true;
      }

      // Check initiative items
      if (
        this.detailsItem.initiativeItem?.some(
          (item: any) => item.status && ReturnedStatuses.includes(item.status)
        )
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if an initiative has any items still in returned status
   */
  private hasAnyReturnedItems(): boolean {
    if (!this.detailsItem) return false;

    // Check if the initiative itself is returned
    if (ReturnedStatuses.includes(this.detailsItem.status)) {
      return true;
    }

    // Check if any of the initiative items are still in returned status (for detailed data)
    if (this.detailsItem.name && typeof this.detailsItem.name === 'object') {
      // Check name
      if (
        this.detailsItem.name.status &&
        ReturnedStatuses.includes(this.detailsItem.name.status)
      ) {
        return true;
      }

      // Check KPIs
      if (
        this.detailsItem.initiativeKPIs?.some(
          (kpi: any) => kpi.status && ReturnedStatuses.includes(kpi.status)
        )
      ) {
        return true;
      }

      // Check initiative items
      if (
        this.detailsItem.initiativeItem?.some(
          (item: any) => item.status && ReturnedStatuses.includes(item.status)
        )
      ) {
        return true;
      }
    }

    return false;
  }
}
