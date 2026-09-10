import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  effect,
  inject,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AnalysisStageService } from '../../services/analysis-stage.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RolePermissionsService } from '../../../../Core/Service/role-permissions.service';
import {
  RolesEnums,
  ApprovalStatusEnum,
} from '../../../../Core/utilities/consts';
import { StagesHeaderComponent } from '../../../../shared/components/stages-header/stages-header.component';
import { AnalysisTopParComponent } from '../../components/analysis-top-par/analysis-top-par.component';
import { PlanStatusService } from '../../services/PlanStatus.service';
import { Subject } from 'rxjs';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AnalysisStatusService } from '../../services/analysis-status.service';
import { environment } from '../../../../../environments/environment';
import { PageTitleService } from '../../../page-titles/services/page-title.service';
import { SavePopupComponent } from "../../../../save-popup/save-popup.component";

@Component({
  selector: 'app-analysis-stage-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    StagesHeaderComponent,
    AnalysisTopParComponent,
    ConfirmDialogComponent,
    SavePopupComponent
],
  templateUrl: './analysis-stage-home.component.html',
  styleUrl: './analysis-stage-home.component.css',
})
export class AnalysisStageHomeComponent implements OnInit, OnDestroy {
  private readonly analysisStageService = inject(AnalysisStageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rolePermissions = inject(RolePermissionsService);
  private readonly planStatusService = inject(PlanStatusService);
  public readonly analysisStatusService = inject(AnalysisStatusService);
  private readonly pageTitleService = inject(PageTitleService);

  // Cleanup subscriptions when the component is destroyed
  private destroy$ = new Subject<void>();

  stageTitle = 'تحليل الخطة الاستراتيجية';
  stageDescription = 'وصف الخطة الاستراتيجية';
  isSuccessPopupVisible = false;
  isManager = false;
  unitId: string | null = null;
  planId: string | null = null;
  userInfo: any;
  approveButtonText = 'تأكيد';
  showFormPopup = true;
  showConfirmPopup = false;
  // Flag to track if direction stage is active
  isDirectionStageActive = false;

  // Confirmation dialog properties
  showConfirmationDialog = false;
  confirmationMessage =
    'هل أنت متأكد من رغبتك في تأكيد تحليل الخطة الاستراتيجية؟';
  isLoading = false;

  // Debug message for administrators
  debugStatusResult: any = null;

  // Flag to show debug tools in non-production environments
  isDevelopment = !environment.production;

  // Effect for reactive updates on point status changes
  private pointStatusWatcher = effect(
    () => {
      // Track all relevant signals to ensure effect runs when any of them change
      const allPointsActedUpon =
        this.analysisStatusService.allPointsActedUpon();
      const canApproveBasedOnRole =
        this.analysisStatusService.canApproveBasedOnRole();
      const canShowButton = this.analysisStatusService.canShowSubmitButton();
      const isPointsDataLoaded =
        this.analysisStatusService.isPointsDataLoaded();
      const stageStatus = this.analysisStatusService.stageStatus();

      console.log('[AnalysisStageHomeComponent] Effect: Status changed', {
        allPointsActedUpon,
        canApproveBasedOnRole,
        canShowButton,
        isPointsDataLoaded,
        stageStatus,
      });

      // Request change detection to update the UI
      this.cdr.detectChanges();
    },
    { allowSignalWrites: true }
  );

  // Effect to monitor when points data is fully loaded
  private dataLoadedWatcher = effect(
    () => {
      const isPointsDataLoaded =
        this.analysisStatusService.isPointsDataLoaded();
      const isDataLoading = this.analysisStatusService.isDataLoading();

      // Force change detection when data loading completes
      if (isPointsDataLoaded && !isDataLoading) {
        setTimeout(() => {
          console.log(
            '[AnalysisStageHomeComponent] Running change detection after data load'
          );
          this.cdr.detectChanges();
        }, 0);
      }
    },
    { allowSignalWrites: true }
  );
  onFormClosed(success: boolean) {
    this.showFormPopup = false; // اقفل الفورم

    if (success) {
      setTimeout(() => {
        this.showConfirmPopup = true; // افتح Popup التأكيد

        setTimeout(() => {
          this.showConfirmPopup = false; // اقفله بعد 2 ثانية
        }, 2000);

      }, 200); // delay بسيط عشان الفورم يقفل تمام
    }
  }

  // Helper methods to check the current stage status for UI display
  isStageApproved(): boolean {
    const status = this.analysisStatusService.stageStatus?.() || null;
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
    const status = this.analysisStatusService.stageStatus?.() || null;
    return (
      status === ApprovalStatusEnum.RejectedByHighManagement ||
      status === ApprovalStatusEnum.RejectedByRegionManager ||
      status === ApprovalStatusEnum.RejectedByUnitManager
    );
  }

  isStageReturned(): boolean {
    const status = this.analysisStatusService.stageStatus?.() || null;
    return (
      status === ApprovalStatusEnum.ReturnedByHighManagement ||
      status === ApprovalStatusEnum.ReturnedByRegionManager ||
      status === ApprovalStatusEnum.ReturnedByUnitManager
    );
  }

  isWaitingForAction(): boolean {
    const status = this.analysisStatusService.stageStatus?.() || null;
    return status === ApprovalStatusEnum.Pending;
  }

  ngOnInit(): void {
    this.pageTitleService.getAllTitles().subscribe({
      next: (res) => {
        const t = res.titles.find(t => t.key === 'analysis_title');
        if (t) this.stageTitle = t.currentValue;
        const d = res.titles.find(t => t.key === 'analysis_description');
        if (d) this.stageDescription = d.currentValue;
      },
    });
    // Ensure we have the correct user role from localStorage
    console.log(
      `[AnalysisStageHomeComponent] Initial user role: ${this.authService.getUserRole()}`
    );
    const refreshedRole = this.authService.refreshUserRole();
    console.log(
      `[AnalysisStageHomeComponent] Refreshed user role from localStorage: ${refreshedRole}`
    );

    this.planId = this.route.snapshot.paramMap.get('planId');

    if (this.planId) {
      // Set the plan ID in both services for reactive state management
      this.planStatusService.setPlanId(this.planId);
      this.analysisStatusService.setPlanId(this.planId);

      // Extract current stage from URL if present
      const currentUrl = this.router.url;
      const lastSegment = currentUrl.split('/').pop();
      if (lastSegment && lastSegment !== 'analysis-stage') {
        this.planStatusService.setCurrentStage(lastSegment);
      }

      // Force refresh of analysis status to check button visibility
      this.analysisStatusService.pointStatusChanged();
    }

    this.isManager = this.authService.allowInRoles([
      RolesEnums.HighManagement,
      RolesEnums.RegionManager,
      RolesEnums.UnitManager,
    ]);

    // Get appropriate button text based on user role
    this.approveButtonText = this.rolePermissions.getApproveButtonText();

    // Check if direction stage is active
    this.checkDirectionStageStatus();

    // Load user info for display
    if (this.planId) {
      this.loadUserInfo();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up the effects
    if (this.pointStatusWatcher) {
      this.pointStatusWatcher.destroy();
    }

    if (this.dataLoadedWatcher) {
      this.dataLoadedWatcher.destroy();
    }
  }

  // Method to check if direction stage is active via API
  private checkDirectionStageStatus(): void {
    if (!this.planId) return;

    this.planStatusService.getPlanStatus(this.planId).subscribe({
      next: (planStatus) => {
        this.isDirectionStageActive = planStatus.directionStage;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching plan status:', error);
        this.isDirectionStageActive = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Computed getters to access signals from the service
  get showAnalysisSubmissionBtn(): boolean {
    return this.analysisStatusService.canShowSubmitButton();
  }

  get buttonDisabledReason(): string {
    return this.analysisStatusService.buttonDisabledReason();
  }

  get isAnalysisApproved(): boolean {
    return this.analysisStatusService.isAnalysisApproved();
  }

  get isDataReady(): boolean {
    return this.analysisStatusService.isInitialized();
  }

  get isDataLoading(): boolean {
    return this.analysisStatusService.isDataLoading();
  }

  closeSuccessPopup() {
    this.isSuccessPopupVisible = false;
  }

  // Show confirmation dialog before approving
  approveAnalysis(): void {
    this.showConfirmationDialog = true;
  }

  // Cancel the approval process
  cancelApproval(): void {
    this.showConfirmationDialog = false;
  }

  // Execute the approval after confirmation
  executeApproval(): void {
    if (!this.planId) return;
    this.isLoading = true;

    this.analysisStageService.approvePlanAnalysis(this.planId).subscribe({
      next: () => {
        this.isLoading = false;
        this.showConfirmationDialog = false;
        this.isSuccessPopupVisible = true;
        // Notify that the status has changed
        this.analysisStatusService.pointStatusChanged();

        // Check direction stage status after successful approval
        this.checkDirectionStageStatus();

        // If this was High Management approval, set the analysis approval flag
        if (this.authService.getUserRole() === RolesEnums.HighManagement) {
          // Force refresh data to update status
          this.analysisStatusService.forceRefreshAndGetState().then(() => {
            this.cdr.detectChanges();
          });
        }
      },
      error: (err) => {
        console.error('Error approving analysis:', err);
        this.isLoading = false;
        this.showConfirmationDialog = false;
      },
    });
  }

  // Load user info for the top section
  private loadUserInfo(): void {
    if (!this.planId) return;

    this.analysisStageService.getAnalysisStageDetails(this.planId).subscribe({
      next: (response) => {
        this.userInfo = response.data;
      },
      error: (err) => {
        console.error('Error loading user info:', err);
      },
    });
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
      const status = await this.analysisStatusService.forceRefreshAndGetState();
      console.log('Debug status result:', status);

      // Show results in an alert for admins
      let message = `Role: ${status.userRole}\n`;
      message += `Stage Status: ${status.stageStatus}\n`;
      message += `Point Count: ${status.pointCount}\n`;
      message += `Can Approve Stage: ${status.canApprove}\n`;
      message += `All Points Acted Upon: ${status.allPointsActedUpon}\n`;
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
