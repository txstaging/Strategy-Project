import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { ApprovalStatusEnum, RolesEnums } from '../../../Core/utilities/consts';
import { AuthService } from '../../auth/services/auth.service';
import { DirectionStatusService } from './direction-status.service';

@Injectable({
  providedIn: 'root',
})
export class AnalysisStatusService {
  private readonly authService = inject(AuthService);
  private readonly directionStatusService = inject(DirectionStatusService);

  // Current user role signal
  private userRole = signal<RolesEnums | null>(this.authService.getUserRole());

  // Stage completion status signals
  private _totalPoints = signal(0);
  private _actedPointsCount = signal(0);
  private _pendingPointsCount = signal(0);
  private _approvedPointsCount = signal(0);
  private _rejectedPointsCount = signal(0);
  private _returnedPointsCount = signal(0);
  private _isLoading = signal(true);

  // Computed signals for UI
  readonly completionPercentage = computed(() => {
    const total = this._totalPoints();
    return total > 0 ? Math.round((this._actedPointsCount() / total) * 100) : 0;
  });

  readonly stageStatusMessage = computed(() => {
    // If still loading and no data yet, show loading message
    if (this._isLoading() && this._totalPoints() === 0) {
      return {
        text: 'جاري تحميل بيانات المرحلة...',
        type: 'info',
      };
    }

    const isApproved = this.directionStatusService.isDirectionApproved();
    const pendingCount = this._pendingPointsCount();
    const completionPct = this.completionPercentage();

    if (isApproved) {
      return {
        text: 'تم الموافقة على التوجه الاستراتيجي بنجاح',
        type: 'success',
      };
    }

    if (completionPct === 100) {
      return {
        text: 'يمكنك الآن تأكيد التوجه الاستراتيجي بعد استكمال جميع العناصر',
        type: 'info',
      };
    }

    if (pendingCount > 0) {
      return {
        text: `يرجى استكمال اتخاذ الإجراء على ${pendingCount} عناصر متبقية`,
        type: 'warning',
      };
    }

    // Data loaded but no items found case
    return {
      text: 'لا توجد عناصر للتقييم. يرجى إضافة عناصر.',
      type: 'info',
    };
  });

  readonly canSubmitStage = computed(() => {
    return (
      this.completionPercentage() === 100 &&
      !this.directionStatusService.isDirectionApproved() &&
      !this._isLoading() &&
      this._totalPoints() > 0
    );
  });

  readonly isLoading = computed(() => {
    return this._isLoading();
  });

  constructor() {
    // Set up effect to track changes in direction status service points
    effect(
      () => {
        // Get data loading state first
        this._isLoading.set(this.directionStatusService.isDataLoading());

        // Then process points when available
        const points = this.directionStatusService.points();
        this.updatePointsAnalysis(points);
      },
      { allowSignalWrites: true }
    );

    // Set up effect to track user role changes
    effect(
      () => {
        const newRole = this.authService.getUserRole();
        this.userRole.set(newRole);
      },
      { allowSignalWrites: true }
    );
  }

  /**
   * Updates analysis statistics based on the current points and their statuses
   */
  private updatePointsAnalysis(points: any[]): void {
    if (!points || !Array.isArray(points)) {
      this._totalPoints.set(0);
      this._actedPointsCount.set(0);
      this._pendingPointsCount.set(0);
      this._approvedPointsCount.set(0);
      this._rejectedPointsCount.set(0);
      this._returnedPointsCount.set(0);
      return;
    }

    // Update the total count
    this._totalPoints.set(points.length);

    // Count points by status
    let actedCount = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let returnedCount = 0;

    points.forEach((point) => {
      const status = point.status;

      // Count based on status
      if (status === ApprovalStatusEnum.Pending || status === 'Pending') {
        pendingCount++;
      } else {
        actedCount++;

        // Further categorize acted points
        if (status?.includes('Approved')) {
          approvedCount++;
        } else if (status?.includes('Rejected')) {
          rejectedCount++;
        } else if (status?.includes('Returned')) {
          returnedCount++;
        }
      }
    });

    // Update all count signals
    this._actedPointsCount.set(actedCount);
    this._pendingPointsCount.set(pendingCount);
    this._approvedPointsCount.set(approvedCount);
    this._rejectedPointsCount.set(rejectedCount);
    this._returnedPointsCount.set(returnedCount);
  }

  /**
   * Manually update a point status without waiting for API
   * Updates both point status and related item/element status
   *
   * @param pointId The ID of the point to update
   * @param newStatus The new status to set
   */
  updatePointStatus(pointId: string | number, newStatus: string): void {
    // Update the point status in direction status service
    this.directionStatusService.updatePointStatus(pointId, newStatus);

    // Re-analyze points immediately to update UI
    const updatedPoints = this.directionStatusService.points();
    this.updatePointsAnalysis(updatedPoints);
  }

  /**
   * Force a refresh of the points analysis
   * Useful when we need to trigger UI updates directly
   */
  refreshAnalysis(): void {
    const points = this.directionStatusService.points();
    this.updatePointsAnalysis(points);
  }
}
