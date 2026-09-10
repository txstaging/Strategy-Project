import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  effect,
  inject,
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { DirectionStatusService } from '../../services/direction-status.service';
import { StrategicDirectionService } from '../../services/strategic-direction.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RolePermissionsService } from '../../../../Core/Service/role-permissions.service';
import {
  RolesEnums,
  ApprovalStatusEnum,
} from '../../../../Core/utilities/consts';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StagesHeaderComponent } from '../../../../shared/components/stages-header/stages-header.component';
import { environment } from '../../../../../environments/environment';
import { PageTitleService } from '../../../page-titles/services/page-title.service';

@Component({
  selector: 'app-strategic-direction-home',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    ConfirmDialogComponent,
    StagesHeaderComponent,
  ],
  templateUrl: './strategic-direction-home.component.html',
  styleUrl: './strategic-direction-home.component.css',
})
export class StrategicDirectionHomeComponent implements OnInit, OnDestroy {
  private readonly strategicDirectionService = inject(
    StrategicDirectionService
  );
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rolePermissions = inject(RolePermissionsService);
  public readonly directionStatusService = inject(DirectionStatusService);
  private readonly pageTitleService = inject(PageTitleService);

  // Cleanup subscriptions when the component is destroyed
  private destroy$ = new Subject<void>();

  stageTitle = 'التوجيه الاستراتيجي';
  stageDescription = 'وصف التوجيه الاستراتيجي';
  isSuccessPopupVisible = false;
  isManager = false;
  planId: string | null = null;
  userInfo: any;
  approveButtonText = 'تأكيد';
  readonly resubmitButtonText = 'إعادة إرسال المرحلة';
  planDirectionId: string | null = null;

  // Confirmation dialog properties
  showConfirmationDialog = false;
  confirmationMessage = 'هل أنت متأكد من رغبتك في تأكيد التوجيه الاستراتيجي؟';
  isLoading = false;

  // Debug message for administrators
  debugStatusResult: any = null;

  // Flag to show debug tools in non-production environments
  isDevelopment = !environment.production;

  // Effect for reactive updates on direction item status changes
  private itemStatusWatcher = effect(
    () => {
      // Track all relevant signals to ensure effect runs when any of them change
      const allItemsActedUpon = this.directionStatusService.allItemsActedUpon();
      const canApproveBasedOnRole =
        this.directionStatusService.canApproveBasedOnRole();
      const canShowButton = this.directionStatusService.canShowSubmitButton();
      const canShowResubmitButton =
        this.directionStatusService.canShowResubmitButton();
      const isDirectionDataLoaded =
        this.directionStatusService.isDirectionDataLoaded();
      const stageStatus = this.directionStatusService.stageStatus();
      const isDirectionApproved =
        this.directionStatusService.isDirectionApproved();
      const buttonDisabledReason =
        this.directionStatusService.buttonDisabledReason();

      console.log('[StrategicDirectionHomeComponent] Effect: Status changed', {
        allItemsActedUpon,
        canApproveBasedOnRole,
        canShowButton,
        canShowResubmitButton,
        isDirectionDataLoaded,
        stageStatus,
        isDirectionApproved,
        buttonDisabledReason,
      });

      // Request change detection to update the UI
      this.cdr.detectChanges();
    },
    { allowSignalWrites: true }
  );

  // Effect to monitor when direction data is fully loaded
  private dataLoadedWatcher = effect(
    () => {
      const isDirectionDataLoaded =
        this.directionStatusService.isDirectionDataLoaded();
      const isDataLoading = this.directionStatusService.isDataLoading();

      console.log(
        '[StrategicDirectionHomeComponent] Data loading state changed:',
        {
          isDirectionDataLoaded,
          isDataLoading,
        }
      );

      // Force change detection when data loading completes
      if (isDirectionDataLoaded && !isDataLoading) {
        setTimeout(() => {
          console.log(
            '[StrategicDirectionHomeComponent] Running change detection after data load'
          );
          this.cdr.detectChanges();
        }, 0);
      }
    },
    { allowSignalWrites: true }
  );

  // Helper methods to check the current stage status for UI display
  isStageApproved(): boolean {
    const status = this.directionStatusService.stageStatus?.() || null;
    return (
      status === ApprovalStatusEnum.ApprovedByHighManagement ||
      status === ApprovalStatusEnum.ApprovedByHighManagementPartially ||
      status === ApprovalStatusEnum.ApprovedByRegionManager ||
      status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
      status === ApprovalStatusEnum.ApprovedByUnitManager ||
      status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
    );
  }

  isStageRejected(): boolean {
    const status = this.directionStatusService.stageStatus?.() || null;
    return (
      status === ApprovalStatusEnum.RejectedByHighManagement ||
      status === ApprovalStatusEnum.RejectedByRegionManager ||
      status === ApprovalStatusEnum.RejectedByUnitManager
    );
  }

  isStageReturned(): boolean {
    const status = this.directionStatusService.stageStatus?.() || null;
    return (
      status === ApprovalStatusEnum.ReturnedByHighManagement ||
      status === ApprovalStatusEnum.ReturnedByRegionManager ||
      status === ApprovalStatusEnum.ReturnedByUnitManager
    );
  }

  isWaitingForAction(): boolean {
    const status = this.directionStatusService.stageStatus?.() || null;
    return status === ApprovalStatusEnum.Pending;
  }

  ngOnInit(): void {
    this.pageTitleService.getAllTitles().subscribe({
      next: (res) => {
        const t = res.titles.find(t => t.key === 'direction_title');
        if (t) this.stageTitle = t.currentValue;
        const d = res.titles.find(t => t.key === 'direction_description');
        if (d) this.stageDescription = d.currentValue;
      },
    });
    // Ensure we have the correct user role from localStorage
    console.log(
      `[StrategicDirectionHomeComponent] Initial user role: ${this.authService.getUserRole()}`
    );
    const refreshedRole = this.authService.refreshUserRole();
    console.log(
      `[StrategicDirectionHomeComponent] Refreshed user role from localStorage: ${refreshedRole}`
    );

    this.planId = this.route.snapshot.paramMap.get('planId');

    if (this.planId) {
      // Set the plan ID in the services for reactive state management
      this.directionStatusService.setPlanId(this.planId);

      // Force refresh of direction status to check button visibility
      this.directionStatusService.directionItemStatusChanged();
    }

    this.isManager = this.authService.allowInRoles([
      RolesEnums.HighManagement,
      RolesEnums.RegionManager,
      RolesEnums.UnitManager,
    ]);

    // Get appropriate button text based on user role
    this.approveButtonText = this.rolePermissions.getApproveButtonText();

    // Load user info for display
    if (this.planId) {
      this.loadUserInfo();
    }

    // Monitor route parameters for action=approve
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params['action'] === 'approve') {
          this.approveDirection();
          // Remove the query param to avoid reapproving on page refresh
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true,
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up the effects
    if (this.itemStatusWatcher) {
      this.itemStatusWatcher.destroy();
    }

    if (this.dataLoadedWatcher) {
      this.dataLoadedWatcher.destroy();
    }
  }

  closeSuccessPopup() {
    this.isSuccessPopupVisible = false;
  }

  // Show confirmation dialog before approving
  approveDirection(): void {
    this.showConfirmationDialog = true;
  }

  // Cancel the approval process
  cancelApproval(): void {
    this.showConfirmationDialog = false;
  }

  // Execute the approval after confirmation
  executeApproval(): void {
    if (!this.planId || !this.planDirectionId) return;
    this.isLoading = true;

    this.strategicDirectionService
      .approvePlanDirection(this.planId, this.planDirectionId)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.showConfirmationDialog = false;
          this.isSuccessPopupVisible = true;

          // Notify that the status has changed
          this.directionStatusService.directionItemStatusChanged();
        },
        error: (err) => {
          console.error('Error approving direction:', err);
          this.isLoading = false;
          this.showConfirmationDialog = false;
        },
      });
  }

  // Load user info for the top section
  private loadUserInfo(): void {
    if (!this.planId) return;

    this.strategicDirectionService.getPlanDirection(this.planId).subscribe({
      next: (response) => {
        this.userInfo = response.data;

        // Extract and store planDirectionId from response
        if (response.data && response.data.id) {
          this.planDirectionId = response.data.id.toString();
        }
      },
      error: (err) => {
        console.error('Error loading user info:', err);
      },
    });
  }

  // Computed getters to access signals from the service
  get showDirectionSubmissionBtn(): boolean {
    return this.directionStatusService.canShowSubmitButton();
  }

  get showDirectionResubmitBtn(): boolean {
    return this.directionStatusService.canShowResubmitButton();
  }

  get buttonDisabledReason(): string {
    return this.directionStatusService.buttonDisabledReason();
  }

  get isDirectionApproved(): boolean {
    return this.directionStatusService.isDirectionApproved();
  }

  get isDataReady(): boolean {
    return this.directionStatusService.isInitialized();
  }

  get isDataLoading(): boolean {
    return this.directionStatusService.isDataLoading();
  }

  // Helper method to debug button visibility issues
  async debugStatus(): Promise<void> {
    if (!this.planId) {
      alert('No plan ID available');
      return;
    }

    this.isLoading = true;
    try {
      // Force refresh and get current state
      const status =
        await this.directionStatusService.forceRefreshAndGetState();

      // Show results in an alert for admins
      let message = `Role: ${status.userRole}\n`;
      message += `Stage Status: ${status.stageStatus}\n`;
      message += `Item Count: ${status.itemsCount}\n`;
      message += `Can Approve Stage: ${status.canApprove}\n`;
      message += `All Items Acted Upon: ${status.allItemsActedUpon}\n`;
      message += `Button Visible: ${status.canShowButton}\n`;
      message += `Reason: ${status.buttonReason || 'None'}`;

      alert(message);
      this.debugStatusResult = status;
    } catch (error) {
      console.error('Error debugging status:', error);
      alert('Error debugging status: ' + JSON.stringify(error));
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}
