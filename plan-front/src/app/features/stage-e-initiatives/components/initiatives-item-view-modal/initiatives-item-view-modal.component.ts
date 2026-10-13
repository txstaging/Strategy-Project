import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  RolesEnums,
  ApprovalStatusEnum,
} from '../../../../Core/utilities/consts';
import { AuthService } from '../../../auth/services/auth.service';
import { InitiativesService } from '../../services/initiatives.service';
import { InitiativesStatusService } from '../../services/initiatives-status.service';
import {
  blocksApproval,
  canRoleActInStage,
} from '../../../../Core/utilities/approval-ladder';
import { ActionsAdminComponent } from '../../../../shared/components/app-admin-actions/app-admin-actions.component';
import { StatusActionComponent } from '../../../../shared/components/status-action/status.component';

@Component({
  selector: 'app-initiatives-item-view-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ActionsAdminComponent,
    StatusActionComponent,
  ],
  templateUrl: './initiatives-item-view-modal.component.html',
  styleUrl: './initiatives-item-view-modal.component.css',
})
export class InitiativesItemViewModalComponent implements OnInit {
  isAllowToApprove = false;
  planId = '';
  @Input() isOpen = false;
  @Input() isAdmin = false;
  @Input() isInitiativesApproved = false;
  @Input() initiative: any;
  @Output() closed = new EventEmitter<void>();
  @Output() dataUpdated = new EventEmitter<void>();
  reasonModalType: 'reject' | 'return' | null = null;
  selectedItemId: any = null;
  showReasonModal = false;
  reasonComment = '';
  selectedItemType: 'kpi' | 'item' = 'item';

  constructor(
    private authService: AuthService,
    private initiativesService: InitiativesService,
    private route: ActivatedRoute,
    private initiativesStatusService: InitiativesStatusService
  ) {
    this.isAllowToApprove = this.authService.allowInRoles([
      RolesEnums.UnitManager,
      RolesEnums.RegionManager,
      RolesEnums.HighManagement,
    ]);
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.planId = params['planId'];
    });
  }

  handleAccept(item: any) {
    // Legacy method - kept for compatibility
    this.handleAcceptItem(item.id);
  }

  handleReject(item: any) {
    // Legacy method - kept for compatibility
    this.handleRejectItem(item.id);
  }

  handleReturn(item: any) {
    // Legacy method - kept for compatibility
    this.handleReturnItem(item.id);
  }

  handleRejectName(itemId: any) {
    this.reasonModalType = 'reject';
    this.selectedItemId = itemId;
    this.selectedItemType = 'item'; // Treat name like an item for modal purposes
    this.showReasonModal = true;
    this.reasonComment = '';
  }

  handleReturnName(itemId: any) {
    this.reasonModalType = 'return';
    this.selectedItemId = itemId;
    this.selectedItemType = 'item'; // Treat name like an item for modal purposes
    this.showReasonModal = true;
    this.reasonComment = '';
  }

  // KPI-specific handlers
  handleAcceptKPI(itemId: any) {
    this.initiativesService
      .approveInitiativeKPI(this.planId, itemId)
      .subscribe({
        next: (response: any) => {
          console.log('KPI approved successfully:', response);
          this.refreshInitiativeData(); // Refresh data for real-time update
        },
        error: (error: any) => {
          console.error('Error approving KPI:', error);
        },
      });
  }

  handleRejectKPI(itemId: any) {
    this.reasonModalType = 'reject';
    this.selectedItemId = itemId;
    this.selectedItemType = 'kpi';
    this.showReasonModal = true;
    this.reasonComment = '';
  }

  handleReturnKPI(itemId: any) {
    this.reasonModalType = 'return';
    this.selectedItemId = itemId;
    this.selectedItemType = 'kpi';
    this.showReasonModal = true;
    this.reasonComment = '';
  }

  // Initiative Item-specific handlers
  handleAcceptItem(itemId: any) {
    this.initiativesService
      .approveInitiativeItem(this.planId, itemId)
      .subscribe({
        next: (response: any) => {
          console.log('Initiative item approved successfully:', response);
          this.refreshInitiativeData(); // Refresh data for real-time update
        },
        error: (error: any) => {
          console.error('Error approving initiative item:', error);
        },
      });
  }

  handleRejectItem(itemId: any) {
    this.reasonModalType = 'reject';
    this.selectedItemId = itemId;
    this.selectedItemType = 'item';
    this.showReasonModal = true;
    this.reasonComment = '';
  }

  handleReturnItem(itemId: any) {
    this.reasonModalType = 'return';
    this.selectedItemId = itemId;
    this.selectedItemType = 'item';
    this.showReasonModal = true;
    this.reasonComment = '';
  }

  // Modal handling for reject/return with comments
  submitReasonAction() {
    if (!this.reasonComment.trim()) {
      alert('يرجى إدخال تعليق');
      return;
    }

    const comment = this.reasonComment.trim();

    if (this.selectedItemType === 'kpi') {
      if (this.reasonModalType === 'reject') {
        this.initiativesService
          .rejectInitiativeKPI(
            this.planId,
            this.initiative.id.toString(),
            this.selectedItemId,
            comment
          )
          .subscribe({
            next: () => {
              this.closeReasonModal();
              this.refreshInitiativeData(); // Refresh data for real-time update
            },
            error: (error) => {
              console.error('Error rejecting KPI:', error);
            },
          });
      } else if (this.reasonModalType === 'return') {
        this.initiativesService
          .returnInitiativeKPI(
            this.planId,
            this.initiative.id.toString(),
            this.selectedItemId,
            comment
          )
          .subscribe({
            next: () => {
              this.closeReasonModal();
              this.refreshInitiativeData(); // Refresh data for real-time update
            },
            error: (error) => {
              console.error('Error returning KPI:', error);
            },
          });
      }
    } else if (this.selectedItemType === 'item') {
      if (this.reasonModalType === 'reject') {
        this.initiativesService
          .rejectInitiativeItem(
            this.planId,
            this.initiative.id.toString(),
            this.selectedItemId,
            comment
          )
          .subscribe({
            next: () => {
              this.closeReasonModal();
              this.refreshInitiativeData(); // Refresh data for real-time update
            },
            error: (error) => {
              console.error('Error rejecting item:', error);
            },
          });
      } else if (this.reasonModalType === 'return') {
        this.initiativesService
          .returnInitiativeItem(
            this.planId,
            this.initiative.id.toString(),
            this.selectedItemId,
            comment
          )
          .subscribe({
            next: () => {
              this.closeReasonModal();
              this.refreshInitiativeData(); // Refresh data for real-time update
            },
            error: (error) => {
              console.error('Error returning item:', error);
            },
          });
      }
    }
  }

  closeReasonModal() {
    this.showReasonModal = false;
    this.reasonModalType = null;
    this.selectedItemId = null;
    this.reasonComment = '';
    this.selectedItemType = 'item';
  }

  /**
   * Whether the current manager may approve, reject or return an element at
   * this status. Same ladder as the backend (Utils.CanRoleActInStage).
   *
   * This used to be "the status does not name my role", so once a rework sent
   * the stage back to the unit manager, every element the region manager or
   * high management had already approved offered its buttons again — and
   * approving one wrote it back down to the unit manager, so the approvals
   * really did start over.
   */
  canActOn(itemStatus: string | null | undefined): boolean {
    if (this.isInitiativesApproved || !this.isAllowToApprove) return false;
    return canRoleActInStage(
      itemStatus,
      this.initiativesStatusService.getStageStatus(),
      this.authService.getUserRole()
    );
  }

  // An element is done for this role once it is approved at this level or
  // above; an approval earned higher up before a rework still counts.
  private isElementDone(itemStatus: string | null | undefined): boolean {
    return !blocksApproval(itemStatus, this.authService.getUserRole());
  }

  /**
   * Check if an action has already been taken by the current manager role
   */
  isActionAlreadyTakenByTheCurrentManager(itemStatus: string): boolean {
    if (!itemStatus) {
      return false;
    }

    const userRole = this.authService.getUserRole();

    // Check based on current user role
    if (userRole === RolesEnums.UnitManager) {
      const hasAction = itemStatus.includes('UnitManager');

      return hasAction;
    }
    if (userRole === RolesEnums.RegionManager) {
      const hasAction = itemStatus.includes('RegionManager');

      return hasAction;
    }
    if (userRole === RolesEnums.HighManagement) {
      const hasAction = itemStatus.includes('HighManagement');

      return hasAction;
    }

    return false;
  }

  // Add missing methods
  closeModal() {
    this.closed.emit();
  }

  // Add method to refresh initiative data
  private refreshInitiativeData() {
    if (this.initiative?.id) {
      this.initiativesService.getInitiativeById(this.initiative.id).subscribe({
        next: (updatedInitiative) => {
          this.initiative = updatedInitiative;
          this.dataUpdated.emit(); // Notify parent component
        },
        error: (error) => {
          console.error('Error refreshing initiative data:', error);
        },
      });
    }
  }

  /**
   * Check if all items in the initiative have been completely acted upon (approved or rejected, not returned)
   */
  canApproveInitiative(): boolean {
    if (!this.initiative || this.isInitiativesApproved) {
      return false;
    }

    const userRole = this.authService.getUserRole();
    if (!userRole || !this.isAllowToApprove) {
      return false;
    }

    // Check if the current user role can approve this initiative status
    const canApproveByRole = this.canUserRoleApproveInitiativeStatus(
      userRole,
      this.initiative.status
    );

    if (!canApproveByRole) {
      return false;
    }

    // For all initiatives, require all individual items to be complete before allowing final approval
    // Check if initiative overall status is in a complete state
    const overallStatusComplete = this.isItemCompletelyActedUpon(
      this.initiative.status,
      userRole
    );

    // Check if initiative name is in a complete state
    const nameComplete = this.isItemCompletelyActedUpon(
      this.initiative.name?.status,
      userRole
    );

    // Check if all KPIs are in complete state
    const kpisComplete =
      this.initiative.initiativeKPIs?.every((kpi: any) =>
        this.isItemCompletelyActedUpon(kpi.status, userRole)
      ) ?? true; // If no KPIs, consider complete

    // Check if all items are in complete state
    const itemsComplete =
      this.initiative.initiativeItem?.every((item: any) =>
        this.isItemCompletelyActedUpon(item.status, userRole)
      ) ?? true; // If no items, consider complete

    const canApprove =
      overallStatusComplete && nameComplete && kpisComplete && itemsComplete;

    return canApprove;
  }

  /**
   * Check if the current user role can approve the given initiative status
   */
  private canUserRoleApproveInitiativeStatus(
    userRole: string,
    initiativeStatus: string
  ): boolean {
    // Unit Manager can approve "Pending" initiatives
    if (
      userRole === RolesEnums.UnitManager &&
      initiativeStatus === ApprovalStatusEnum.Pending
    ) {
      return true;
    }

    // Region Manager can approve initiatives approved by Unit Manager
    if (
      userRole === RolesEnums.RegionManager &&
      (initiativeStatus === ApprovalStatusEnum.ApprovedByUnitManager ||
        initiativeStatus === ApprovalStatusEnum.ApprovedByUnitManagerPartially)
    ) {
      return true;
    }

    // High Management can approve initiatives approved by Region Manager
    if (
      userRole === RolesEnums.HighManagement &&
      (initiativeStatus === ApprovalStatusEnum.ApprovedByRegionManager ||
        initiativeStatus ===
          ApprovalStatusEnum.ApprovedByRegionManagerPartially)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Check if an item is in a complete state (approved or rejected by current role, not returned or pending)
   */
  private isItemCompletelyActedUpon(
    itemStatus: string,
    userRole: string
  ): boolean {
    if (!itemStatus || !userRole) return false;

    // Define complete statuses for each role (includes partial approvals as complete actions)
    const completeStatuses: Record<string, string[]> = {
      [RolesEnums.UnitManager]: [
        'ApprovedByUnitManager',
        'ApprovedByUnitManagerPartially',
        'RejectedByUnitManager',
      ],
      [RolesEnums.RegionManager]: [
        'ApprovedByRegionManager',
        'ApprovedByRegionManagerPartially',
        'RejectedByRegionManager',
      ],
      [RolesEnums.HighManagement]: [
        'ApprovedByHighManagement',
        'ApprovedByHighManagementPartially',
        'RejectedByHighManagement',
      ],
    };

    const roleCompleteStatuses = completeStatuses[userRole] || [];
    return roleCompleteStatuses.some((status: string) =>
      itemStatus.includes(status)
    );
  }

  /**
   * Handle initiative-level approval (approve the whole initiative)
   */
  handleApproveInitiative() {
    if (!this.initiative?.id) return;

    this.initiativesService
      .approveInitiative(this.initiative.id.toString())
      .subscribe({
        next: () => {
          this.refreshInitiativeData(); // Refresh data for real-time update
        },
        error: (error: any) => {
          console.error('Error approving initiative:', error);
        },
      });
  }

  // Simple method to approve initiative name
  handleApproveInitiativeName() {
    if (!this.initiative?.id) {
      console.error('No initiative ID available for approval');
      return;
    }

    this.initiativesService
      .approveInitiative(this.initiative.id.toString())
      .subscribe({
        next: () => {
          this.refreshInitiativeData(); // Refresh data for real-time update
        },
        error: (error: any) => {
          console.error('Error approving initiative name:', error);
        },
      });
  }

  /**
   * Handle initiative overall status approval (separate from name)
   */
  handleApproveInitiativeOverall() {
    if (!this.initiative?.id) {
      console.error('No initiative ID available for overall approval');
      return;
    }

    this.initiativesService
      .approveInitiative(this.initiative.id.toString())
      .subscribe({
        next: () => {
          this.refreshInitiativeData(); // Refresh data for real-time update
        },
        error: (error: any) => {
          console.error('Error approving initiative overall status:', error);
        },
      });
  }

  // Initiative Name-specific handlers (using admin-actions)
  // eslint--next-line @typescript-eslint/no-unused-vars
  handleAcceptName(_itemId: any) {
    if (!this.initiative?.id) {
      console.error('No initiative ID available for name approval');
      return;
    }

    this.initiativesService
      .approveInitiativeItem(this.initiative.id.toString(), _itemId)
      .subscribe({
        next: () => {
          this.refreshInitiativeData(); // Refresh data for real-time update
        },
        error: (error: any) => {
          console.error('Error approving initiative name:', error);
        },
      });
  }

  /**
   * Convert English status to Arabic
   */
  getStatusInArabic(status: string): string {
    if (!status) return 'غير محدد';

    const statusTranslations: Record<string, string> = {
      Pending: 'في الانتظار',
      ApprovedByUnitManager: 'موافق من مدير الوحدة',
      ApprovedByUnitManagerPartially: 'موافق من مدير الوحدة',
      RejectedByUnitManager: 'مرفوض من مدير الوحدة',
      ReturnedByUnitManager: 'مُرجع من مدير الوحدة',
      ApprovedByRegionManager: 'موافق من مدير المنطقة',
      ApprovedByRegionManagerPartially: 'موافق من مدير المنطقة',
      RejectedByRegionManager: 'مرفوض من مدير المنطقة',
      ReturnedByRegionManager: 'مُرجع من مدير المنطقة',
      ApprovedByHighManagement: 'موافق من الإدارة العليا',
      ApprovedByHighManagementPartially: 'موافق من الإدارة العليا',
      RejectedByHighManagement: 'مرفوض من الإدارة العليا',
      ReturnedByHighManagement: 'مُرجع من الإدارة العليا',
      Approved: 'موافق',
      Rejected: 'مرفوض',
      Returned: 'مُرجع',
    };

    return statusTranslations[status] || status;
  }

  /**
   * Check if all individual elements (name, KPIs, items) have been acted upon
   */
  areAllIndividualElementsActedUpon(): boolean {
    if (!this.initiative) {
      return false;
    }

    const userRole = this.authService.getUserRole();

    // Return false if no user role
    if (!userRole) {
      return false;
    }

    // Check if initiative name has been acted upon
    const nameActedUpon = this.isElementDone(this.initiative.name?.status);

    // Check if all KPIs have been acted upon
    const kpisActedUpon =
      this.initiative.initiativeKPIs?.every((kpi: any) =>
        this.isElementDone(kpi.status)
      ) ?? true; // If no KPIs, consider complete

    // Check if all items have been acted upon
    const itemsActedUpon =
      this.initiative.initiativeItem?.every((item: any) =>
        this.isElementDone(item.status)
      ) ?? true; // If no items, consider complete

    const allActedUpon = nameActedUpon && kpisActedUpon && itemsActedUpon;

    return allActedUpon;
  }

  /**
   * Get descriptive messages about which elements are still pending action
   */
  getPendingElementsMessages(): string[] {
    if (!this.initiative) {
      return [];
    }

    const userRole = this.authService.getUserRole();
    if (!userRole) {
      return [];
    }

    const pendingMessages: string[] = [];

    // Check initiative name
    const nameActedUpon = this.isElementDone(this.initiative.name?.status);
    if (!nameActedUpon) {
      pendingMessages.push('اسم المبادرة');
    }

    // Check KPIs
    const pendingKPIs =
      this.initiative.initiativeKPIs?.filter(
        (kpi: any) => !this.isElementDone(kpi.status)
      ) || [];
    if (pendingKPIs.length > 0) {
      if (pendingKPIs.length === 1) {
        pendingMessages.push('مؤشر أداء واحد');
      } else {
        pendingMessages.push(`${pendingKPIs.length} مؤشرات أداء`);
      }
    }

    // Check initiative items
    const pendingItems =
      this.initiative.initiativeItem?.filter(
        (item: any) => !this.isElementDone(item.status)
      ) || [];
    if (pendingItems.length > 0) {
      if (pendingItems.length === 1) {
        pendingMessages.push('عنصر مبادرة واحد');
      } else {
        pendingMessages.push(`${pendingItems.length} عناصر مبادرة`);
      }
    }

    return pendingMessages;
  }
}
