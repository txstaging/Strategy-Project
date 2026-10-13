import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { PlanProjectsService } from '../../services/plan-projects.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ActionsAdminComponent } from '../../../../shared/components/app-admin-actions/app-admin-actions.component';
import { StatusActionComponent } from '../../../../shared/components/status-action/status.component';
import {
  blocksApproval,
  canRoleActInStage,
} from '../../../../Core/utilities/approval-ladder';

@Component({
  selector: 'app-project-view-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ActionsAdminComponent,
    StatusActionComponent,
  ],
  templateUrl: './project-view-modal.component.html',
  styleUrl: './project-view-modal.component.css',
})
export class ProjectViewModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() project: any = null;
  @Input() planId = '';
  @Input() isAdmin = false;
  @Input() isProjectsApproved = false;
  @Output() closed = new EventEmitter<void>();
  @Output() dataUpdated = new EventEmitter<void>();

  // Reason modal properties
  showReasonModal = false;
  reasonModalType: 'reject' | 'return' | null = null;
  reasonComment = '';
  currentActionItemId = '';
  currentActionType = '';

  // The projects stage status. The card is opened both from the stage page and
  // from each table row, so it reads the status itself rather than relying on
  // whoever opened it. Nothing is actionable until it has arrived.
  private stageStatus: string | null = null;
  private stageStatusLoaded = false;

  constructor(
    private authService: AuthService,
    private projectsService: PlanProjectsService
  ) {}

  ngOnInit(): void {
    if (!this.planId) {
      this.stageStatusLoaded = true;
      return;
    }
    this.projectsService.getProjectStatus(this.planId).subscribe({
      next: (response: any) => {
        this.stageStatus = response?.status ?? null;
        this.stageStatusLoaded = true;
      },
      error: () => {
        this.stageStatusLoaded = true;
      },
    });
  }

  /**
   * Whether the current manager may approve, reject or return a field (or the
   * project) at this status. Same ladder as the backend
   * (Utils.CanRoleActInStage).
   *
   * This used to be "the status does not name my role", so when another project
   * was returned and the stage went back to the unit manager, a project the
   * region manager had already approved offered all its buttons again, and
   * approving a field wrote it back down to the unit manager.
   */
  canActOn(status: string | null | undefined): boolean {
    if (this.isProjectsApproved || !this.isAllowToApprove) return false;
    if (!this.stageStatusLoaded) return false;
    return canRoleActInStage(
      status,
      this.stageStatus,
      this.authService.getUserRole()
    );
  }

  // A field is done for this role once it is approved at this level or above;
  // an approval earned higher up before a rework still counts.
  private isFieldDone(status: string | null | undefined): boolean {
    return !blocksApproval(status, this.authService.getUserRole());
  }

  /**
   * «يجب إنهاء جميع الإجراءات في بطاقة المشروع»: this card still has work for
   * the current manager — fields to act on, or the project itself to approve
   * once they are done. Shown at the foot of the card so nobody closes it
   * thinking the project is finished; the stage cannot be sent until it is.
   */
  hasOpenActionsForMe(): boolean {
    if (!this.project) return false;
    return this.canActOn(this.project.status);
  }

  get isAllowToApprove(): boolean {
    return this.authService.allowInRoles([
      RolesEnums.HighManagement,
      RolesEnums.RegionManager,
      RolesEnums.UnitManager,
    ]);
  }

  closeModal(): void {
    this.closed.emit();
  }

  /**
   * Check if current manager has already taken action on an item
   */
  isActionAlreadyTakenByTheCurrentManager(status: string): boolean {
    if (!status) return false;

    const userRole = this.authService.getUserRole();

    if (userRole === RolesEnums.UnitManager) {
      return status.includes('UnitManager');
    }
    if (userRole === RolesEnums.RegionManager) {
      return status.includes('RegionManager');
    }
    if (userRole === RolesEnums.HighManagement) {
      return status.includes('HighManagement');
    }

    return false;
  }

  /**
   * Handle individual project item approvals
   */
  handleAcceptItem(itemId: string): void {
    this.projectsService.approveProjectItem(itemId).subscribe({
      next: () => {
        this.refreshProjectData();
      },
      error: (error) => {
        console.error('Error approving project item:', error);
      },
    });
  }

  handleRejectItem(itemId: string): void {
    this.currentActionItemId = itemId;
    this.currentActionType = 'rejectItem';
    this.reasonModalType = 'reject';
    this.showReasonModal = true;
  }

  handleReturnItem(itemId: string): void {
    this.currentActionItemId = itemId;
    this.currentActionType = 'returnItem';
    this.reasonModalType = 'return';
    this.showReasonModal = true;
  }

  /**
   * Handle overall project approval
   */
  handleApproveProjectOverall(): void {
    if (this.project?.id) {
      this.projectsService
        .approveProject(this.project.id.toString())
        .subscribe({
          next: () => {
            this.refreshProjectData();
          },
          error: (error) => {
            console.error('Error approving project overall:', error);
          },
        });
    }
  }

  /**
   * Check if all individual elements have been acted upon
   */
  areAllIndividualElementsActedUpon(): boolean {
    if (!this.project) return false;

    // Check each project field that has status
    const projectFields = [
      this.project.name,
      this.project.priority,
      this.project.duration,
      this.project.beneficiaries,
      this.project.supervisingAuthority,
      this.project.weight,
    ];
    // Dates are approvable only when present (older projects may not have them).
    if (this.project.startDateItem) projectFields.push(this.project.startDateItem);
    if (this.project.endDateItem) projectFields.push(this.project.endDateItem);

    return projectFields.every((field) => this.isFieldDone(field?.status));
  }

  /**
   * Get pending elements for descriptive messages
   */
  getPendingElementsMessages(): string[] {
    const pendingItems: string[] = [];

    if (
      this.project?.name &&
      !this.isFieldDone(this.project.name.status)
    ) {
      pendingItems.push('اسم المشروع');
    }
    if (
      this.project?.priority &&
      !this.isFieldDone(this.project.priority.status)
    ) {
      pendingItems.push('أولوية المشروع');
    }
    if (
      this.project?.duration &&
      !this.isFieldDone(this.project.duration.status)
    ) {
      pendingItems.push('مدة المشروع');
    }
    if (
      this.project?.beneficiaries &&
      !this.isFieldDone(this.project.beneficiaries.status)
    ) {
      pendingItems.push('المستفيدين');
    }
    if (
      this.project?.supervisingAuthority &&
      !this.isFieldDone(this.project.supervisingAuthority.status)
    ) {
      pendingItems.push('الجهة المشرفة');
    }
    if (
      this.project?.weight &&
      !this.isFieldDone(this.project.weight.status)
    ) {
      pendingItems.push('وزن المشروع');
    }
    if (
      this.project?.startDateItem &&
      !this.isFieldDone(this.project.startDateItem.status)
    ) {
      pendingItems.push('تاريخ البداية');
    }
    if (
      this.project?.endDateItem &&
      !this.isFieldDone(this.project.endDateItem.status)
    ) {
      pendingItems.push('تاريخ النهاية');
    }
    return pendingItems;
  }

  /**
   * Get Arabic status display
   */
  getStatusInArabic(status: string): string {
    const statusMap: Record<string, string> = {
      Pending: 'في الانتظار',
      ApprovedByUnitManager: 'موافق عليه من مدير الوحدة',
      ApprovedByUnitManagerPartially: 'موافق عليه من مدير الوحدة',
      ApprovedByRegionManager: 'موافق عليه من مدير المنطقة',
      ApprovedByRegionManagerPartially: 'موافق عليه من مدير المنطقة',
      ApprovedByHighManagement: 'موافق عليه من الإدارة العليا',
      ApprovedByHighManagementPartially: 'موافق عليه من الإدارة العليا',
      RejectedByUnitManager: 'مرفوض من مدير الوحدة',
      RejectedByRegionManager: 'مرفوض من مدير المنطقة',
      RejectedByHighManagement: 'مرفوض من الإدارة العليا',
      ReturnedByUnitManager: 'مُرجع من مدير الوحدة',
      ReturnedByRegionManager: 'مُرجع من مدير المنطقة',
      ReturnedByHighManagement: 'مُرجع من الإدارة العليا',
    };

    return statusMap[status] || status;
  }

  /**
   * Reason modal handlers
   */
  closeReasonModal(): void {
    this.showReasonModal = false;
    this.reasonModalType = null;
    this.reasonComment = '';
    this.currentActionItemId = '';
    this.currentActionType = '';
  }

  submitReasonAction(): void {
    if (!this.reasonComment.trim()) return;

    if (this.currentActionType === 'rejectItem') {
      this.projectsService
        .rejectProjectItem(
          this.project.id.toString(),
          this.currentActionItemId,
          this.reasonComment
        )
        .subscribe({
          next: () => {
            this.closeReasonModal();
            this.refreshProjectData();
          },
          error: (error) => {
            console.error('Error rejecting project item:', error);
          },
        });
    } else if (this.currentActionType === 'returnItem') {
      this.projectsService
        .returnProjectItem(
          this.project.id.toString(),
          this.currentActionItemId,
          this.reasonComment
        )
        .subscribe({
          next: () => {
            this.closeReasonModal();
            this.refreshProjectData();
          },
          error: (error) => {
            console.error('Error returning project item:', error);
          },
        });
    }
  }

  /**
   * Refresh project data after actions
   */
  private refreshProjectData(): void {
    if (this.project?.id) {
      this.projectsService.getProjectById(this.project.id).subscribe({
        next: (updatedProject) => {
          this.project = updatedProject;
          this.dataUpdated.emit();
        },
        error: (error) => {
          console.error('Error refreshing project data:', error);
        },
      });
    }
  }
}
