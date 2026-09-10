import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AnalysisStageService } from './analysis-stage.service';
import {
  ApprovalStatusEnum,
  RejectionStatuses,
  ReturnedStatuses,
  RolesEnums,
} from '../../../Core/utilities/consts';
import { AuthService } from '../../auth/services/auth.service';
import { RolePermissionsService } from '../../../Core/Service/role-permissions.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AnalysisStatusService {
  private readonly analysisStageService = inject(AnalysisStageService);
  private readonly authService = inject(AuthService);
  private readonly rolePermissions = inject(RolePermissionsService);

  // Subject to trigger data refresh
  private refreshSubject = new BehaviorSubject<void>(undefined);

  // Core signals
  private planId = signal<string | null>(null);
  public stageStatus = signal<ApprovalStatusEnum | null>(null);
  private points = signal<any[]>([]);

  // Additional signals for state tracking
  public isInitialized = signal<boolean>(false);
  public isDataLoading = signal<boolean>(false);
  public isAnalysisApproved = signal<boolean>(false);
  public isPointsDataLoaded = signal<boolean>(false);

  // Derived signals
  private currentUserRole = signal<RolesEnums | null>(
    this.authService.getUserRole()
  );

  // Computed signals
  readonly canApproveBasedOnRole = computed(() => {
    if (
      !this.currentUserRole() ||
      !this.stageStatus() ||
      !this.isPointsDataLoaded()
    )
      return false;

    const role = this.currentUserRole();
    const status = this.stageStatus();

    // Log the approval check
    console.log('[AnalysisStatusService] Checking approval permissions:', {
      role,
      status,
      isPointsDataLoaded: this.isPointsDataLoaded(),
    });

    const canApprove = this.rolePermissions.canApproveWholeStage(
      this.stageStatus()!
    );

    return canApprove;
  });

  readonly allPointsActedUpon = computed(() => {
    const role = this.currentUserRole();
    const points = this.points();
    const stageStatus = this.stageStatus();

    if (!role || points.length === 0 || !this.isPointsDataLoaded()) {
      return false;
    }

    // Hard guard: a rejected or returned point (at ANY level) blocks the stage
    // from being submitted until it is reworked and re-approved. This runs
    // regardless of role branch or the RegionManager display remap below.
    if (
      points.some(
        (p) =>
          RejectionStatuses.includes(p.status) ||
          ReturnedStatuses.includes(p.status)
      )
    ) {
      return false;
    }

    // Log all points with their IDs and statuses for debugging
    console.log(
      '[AnalysisStatusService] All points:',
      points.map((p) => ({
        id: p.id,
        status: p.status,
      }))
    );

    let allActedUpon = false;

    // Standard flows for each role
    if (role === RolesEnums.UnitManager) {
      // For Unit Manager:
      // 1. Approved or rejected points are considered "acted upon"
      // 2. Returned points are NOT considered "acted upon" because they need edits from employees
      // 3. Pending points are NOT considered "acted upon"
      // 4. Points already approved by higher roles (Region Manager/High Management) are considered "acted upon"
      //    regardless of stage status
      // 5. Partially approved points (by any role) are also considered "acted upon"

      // Check if any points are in "returned" status - these need edits before approval
      const hasReturnedPoints = points.some(
        (p) => p.status === ApprovalStatusEnum.ReturnedByUnitManager
      );

      // If any points are returned, we can't approve the stage yet
      if (hasReturnedPoints) {
        allActedUpon = false;
      } else {
        // Get points that need action - use a general approach that works with all points
        const pendingPoints = points.filter((p) => {
          // Check for all possible "acted upon" statuses
          // A point is "ready" only when it has been APPROVED at this level or
          // higher. Rejected/returned/pending points block stage submission.
          const isActedUpon =
            p.status === ApprovalStatusEnum.ApprovedByUnitManager ||
            p.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
            p.status === ApprovalStatusEnum.ApprovedByRegionManager ||
            p.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
            p.status === ApprovalStatusEnum.ApprovedByHighManagement ||
            p.status === ApprovalStatusEnum.ApprovedByHighManagementPartially;

          return !isActedUpon;
        });

        allActedUpon = pendingPoints.length === 0;

        // Log pending points for debugging
        console.log(
          '[AnalysisStatusService] Unit Manager pending points:',
          pendingPoints.map((p) => ({
            id: p.id,
            status: p.status,
          }))
        );
      }

      // Log current points status for debugging
      console.log('[AnalysisStatusService] Unit Manager points check:', {
        allActedUpon,
        stageStatus,
        hasReturnedPoints,
        totalPoints: points.length,
        pendingPoints: this.countPendingPoints(),
        returnedPoints: points.filter(
          (p) => p.status === ApprovalStatusEnum.ReturnedByUnitManager
        ).length,
      });
    } else if (role === RolesEnums.RegionManager) {
      // For Region Manager, similar logic applies:
      // 1. Points approved/rejected by Region Manager are "acted upon"
      // 2. Points rejected by Unit Manager are already handled and can be considered "acted upon"
      // 3. Returned points are NOT considered "acted upon" because they need edits
      // 4. Points already approved by High Management are considered "acted upon" regardless of stage status

      // Check if any points are in "returned" status - these need edits before approval
      const hasReturnedPoints = points.some(
        (p) => p.status === ApprovalStatusEnum.ReturnedByRegionManager
      );

      // If any points are returned, we can't approve the stage yet
      if (hasReturnedPoints) {
        allActedUpon = false;
      } else {
        // Get points that need action
        const pendingPoints = points.filter((p) => {
          // Check for all possible "acted upon" statuses
          // A point is "ready" only when it has been APPROVED at this level or
          // higher. Rejected/returned/pending points block stage submission.
          const isActedUpon =
            p.status === ApprovalStatusEnum.ApprovedByRegionManager ||
            p.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
            p.status === ApprovalStatusEnum.ApprovedByHighManagement ||
            p.status === ApprovalStatusEnum.ApprovedByHighManagementPartially;

          return !isActedUpon;
        });

        allActedUpon = pendingPoints.length === 0;

        // Log pending points for debugging
        console.log(
          '[AnalysisStatusService] Region Manager pending points:',
          pendingPoints.map((p) => ({
            id: p.id,
            status: p.status,
          }))
        );
      }

      // Log for debugging
      console.log('[AnalysisStatusService] Region Manager points check:', {
        allActedUpon,
        stageStatus,
        hasReturnedPoints,
        totalPoints: points.length,
        pendingPoints: this.countPendingPoints(),
        returnedPoints: points.filter(
          (p) => p.status === ApprovalStatusEnum.ReturnedByRegionManager
        ).length,
      });
    } else if (role === RolesEnums.HighManagement) {
      // For High Management, standard logic applies:
      // 1. Points approved/rejected by High Management are "acted upon"
      // 2. Points rejected by Unit Manager or Region Manager are considered "acted upon"
      // 3. Returned points are NOT considered "acted upon" because they need edits
      // 4. All other points need explicit action by High Management

      // Check if any points are in "returned" status - these need edits before approval
      const hasReturnedPoints = points.some(
        (p) => p.status === ApprovalStatusEnum.ReturnedByHighManagement
      );

      // If any points are returned, we can't approve the stage yet
      if (hasReturnedPoints) {
        allActedUpon = false;
      } else {
        // Get points that need action
        const pendingPoints = points.filter((p) => {
          // Check for all possible "acted upon" statuses
          // A point is "ready" only when High Management has APPROVED it.
          // Rejected/returned/pending points block stage submission.
          const isActedUpon =
            p.status === ApprovalStatusEnum.ApprovedByHighManagement ||
            p.status === ApprovalStatusEnum.ApprovedByHighManagementPartially;

          return !isActedUpon;
        });

        allActedUpon = pendingPoints.length === 0;

        // Log pending points for debugging
        console.log(
          '[AnalysisStatusService] High Management pending points:',
          pendingPoints.map((p) => ({
            id: p.id,
            status: p.status,
          }))
        );
      }

      // Log for debugging
      console.log('[AnalysisStatusService] High Management points check:', {
        allActedUpon,
        stageStatus,
        hasReturnedPoints,
        totalPoints: points.length,
        pendingPoints: this.countPendingPoints(),
        returnedPoints: points.filter(
          (p) => p.status === ApprovalStatusEnum.ReturnedByHighManagement
        ).length,
      });
    }

    return allActedUpon;
  });

  readonly canShowSubmitButton = computed(() => {
    // Only show button if data is fully loaded
    if (!this.isPointsDataLoaded()) {
      console.log(
        '[AnalysisStatusService] Cannot show button: data not fully loaded'
      );
      return false;
    }

    const canApprove = this.canApproveBasedOnRole();
    const allActedUpon = this.allPointsActedUpon();
    const canShow = canApprove && allActedUpon;

    console.log('[AnalysisStatusService] Button visibility check:', {
      planId: this.planId(),
      stage: this.stageStatus(),
      role: this.currentUserRole(),
      canApprove,
      allActedUpon,
      canShow,
      pendingPointsCount: this.countPendingPoints(),
    });

    return canShow;
  });

  readonly buttonDisabledReason = computed(() => {
    const role = this.currentUserRole();
    const status = this.stageStatus();
    const points = this.points();

    if (!this.isPointsDataLoaded()) {
      return 'جاري تحميل البيانات...';
    }

    // Check if any points are in "returned" status - if so, provide specific message
    if (role === RolesEnums.UnitManager) {
      const returnedPoints = points.filter(
        (p) => p.status === ApprovalStatusEnum.ReturnedByUnitManager
      );
      if (returnedPoints.length > 0) {
        return `يوجد ${returnedPoints.length} ${returnedPoints.length === 1 ? 'نقطة تم إعادتها' : 'نقاط تم إعادتها'} وتحتاج للتعديل من قبل الموظفين قبل استكمال الإجراءات`;
      }

      // Special message for stage returned by Region Manager or High Management
      if (
        status === ApprovalStatusEnum.ReturnedByRegionManager ||
        status === ApprovalStatusEnum.ReturnedByHighManagement
      ) {
        const pendingPointsCount = this.countPendingPoints();

        if (pendingPointsCount > 0) {
          return `يجب اتخاذ إجراء على ${pendingPointsCount} ${pendingPointsCount === 1 ? 'نقطة متبقية' : 'نقاط متبقية'} قبل إعادة الإرسال إلى المستوى التالي`;
        }

        // If button is visible (all points acted upon) - no need for a message
        if (this.canShowSubmitButton()) {
          return '';
        }

        return 'يمكنك إعادة إرسال المرحلة بعد معالجة النقاط المُعادة';
      }
    } else if (role === RolesEnums.RegionManager) {
      const returnedPoints = points.filter(
        (p) => p.status === ApprovalStatusEnum.ReturnedByRegionManager
      );
      if (returnedPoints.length > 0) {
        return `يوجد ${returnedPoints.length} ${returnedPoints.length === 1 ? 'نقطة تم إعادتها' : 'نقاط تم إعادتها'} وتحتاج للتعديل من قبل الموظفين قبل استكمال الإجراءات`;
      }

      // Special message for stage returned by High Management
      if (status === ApprovalStatusEnum.ReturnedByHighManagement) {
        const pendingPointsCount = this.countPendingPoints();

        if (pendingPointsCount > 0) {
          return `يجب اتخاذ إجراء على ${pendingPointsCount} ${pendingPointsCount === 1 ? 'نقطة متبقية' : 'نقاط متبقية'} قبل إعادة الإرسال إلى الإدارة العليا`;
        }

        // If button is visible (all points acted upon) - no need for a message
        if (this.canShowSubmitButton()) {
          return '';
        }

        return 'يمكنك إعادة إرسال المرحلة بعد معالجة النقاط المُعادة من الإدارة العليا';
      }
    } else if (role === RolesEnums.HighManagement) {
      const returnedPoints = points.filter(
        (p) => p.status === ApprovalStatusEnum.ReturnedByHighManagement
      );
      if (returnedPoints.length > 0) {
        return `يوجد ${returnedPoints.length} ${returnedPoints.length === 1 ? 'نقطة تم إعادتها' : 'نقاط تم إعادتها'} وتحتاج للتعديل من قبل الموظفين قبل استكمال الإجراءات`;
      }
    }

    if (!this.canApproveBasedOnRole()) {
      // Provide more specific messages based on the current stage status
      if (status === ApprovalStatusEnum.Pending) {
        if (
          role === RolesEnums.RegionManager ||
          role === RolesEnums.HighManagement
        ) {
          return 'المرحلة الحالية: في انتظار موافقة مدير الوحدة';
        } else if (role === RolesEnums.UnitEmployee) {
          return 'بعد الانتهاء من إضافة جميع النقاط، سيقوم مدير الوحدة بمراجعتها';
        }
      } else if (
        status === ApprovalStatusEnum.ApprovedByUnitManager ||
        status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      ) {
        if (
          role === RolesEnums.UnitManager ||
          role === RolesEnums.UnitEmployee
        ) {
          return 'تم الموافقة من قبل مدير الوحدة وفي انتظار موافقة مدير المنطقة';
        } else if (role === RolesEnums.HighManagement) {
          return 'المرحلة الحالية: في انتظار موافقة مدير المنطقة';
        }
      } else if (
        status === ApprovalStatusEnum.ApprovedByRegionManager ||
        status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      ) {
        if (role !== RolesEnums.HighManagement) {
          return 'تم الموافقة من قبل مدير المنطقة وفي انتظار الموافقة النهائية من الإدارة العليا';
        }
      } else if (
        status === ApprovalStatusEnum.ApprovedByHighManagement ||
        status === ApprovalStatusEnum.ApprovedByHighManagementPartially
      ) {
        return 'تم الموافقة النهائية على هذه المرحلة';
      } else if (status === ApprovalStatusEnum.RejectedByUnitManager) {
        return 'تم رفض هذه المرحلة من قبل مدير الوحدة';
      } else if (status === ApprovalStatusEnum.RejectedByRegionManager) {
        return 'تم رفض هذه المرحلة من قبل مدير المنطقة';
      } else if (status === ApprovalStatusEnum.RejectedByHighManagement) {
        return 'تم رفض هذه المرحلة من قبل الإدارة العليا';
      } else if (status === ApprovalStatusEnum.ReturnedByUnitManager) {
        if (role === RolesEnums.UnitEmployee) {
          return 'تم إعادة هذه المرحلة من قبل مدير الوحدة، يرجى مراجعة التعليقات وإجراء التعديلات المطلوبة';
        } else {
          return 'تم إعادة هذه المرحلة من قبل مدير الوحدة';
        }
      } else if (status === ApprovalStatusEnum.ReturnedByRegionManager) {
        if (role === RolesEnums.UnitEmployee) {
          return 'تم إعادة هذه المرحلة من قبل مدير المنطقة، يرجى مراجعة التعليقات وإجراء التعديلات المطلوبة';
        } else if (role === RolesEnums.UnitManager) {
          return 'بعد مراجعة النقاط المعادة، يمكنك إعادة إرسال المرحلة إلى مدير المنطقة';
        } else {
          return 'تم إعادة هذه المرحلة من قبل مدير المنطقة';
        }
      } else if (status === ApprovalStatusEnum.ReturnedByHighManagement) {
        if (role === RolesEnums.UnitEmployee) {
          return 'تم إعادة هذه المرحلة من قبل الإدارة العليا، يرجى مراجعة التعليقات وإجراء التعديلات المطلوبة';
        } else if (role === RolesEnums.UnitManager) {
          return 'بعد مراجعة النقاط المعادة، يمكنك إعادة إرسال المرحلة';
        } else if (role === RolesEnums.RegionManager) {
          return 'بعد مراجعة النقاط المعادة، يمكنك إعادة إرسال المرحلة إلى الإدارة العليا';
        } else {
          return 'تم إعادة هذه المرحلة من قبل الإدارة العليا';
        }
      }

      return 'لا يمكنك الموافقة على المرحلة في هذه الحالة';
    }

    if (!this.allPointsActedUpon()) {
      // Use the consistent pending points count for all roles
      const pendingPointsCount = this.countPendingPoints();

      if (pendingPointsCount > 0) {
        if (role === RolesEnums.UnitManager) {
          return `يجب اتخاذ إجراء على ${pendingPointsCount} ${pendingPointsCount === 1 ? 'نقطة متبقية' : 'نقاط متبقية'} قبل الموافقة`;
        } else if (role === RolesEnums.RegionManager) {
          return `يجب اتخاذ إجراء على ${pendingPointsCount} ${pendingPointsCount === 1 ? 'نقطة متبقية' : 'نقاط متبقية'} قبل الإرسال إلى الإدارة العليا`;
        } else if (role === RolesEnums.HighManagement) {
          return `يجب اتخاذ إجراء على ${pendingPointsCount} ${pendingPointsCount === 1 ? 'نقطة متبقية' : 'نقاط متبقية'} قبل الموافقة النهائية`;
        }
      }

      return 'يجب اتخاذ إجراء على جميع النقاط أولاً';
    }

    return '';
  });

  constructor() {
    // Effect to load data when planId changes
    effect(
      () => {
        const id = this.planId();
        if (id) {
          this.loadAnalysisData(id);
        }
      },
      { allowSignalWrites: true }
    );

    // Subscribe to refresh events
    this.refreshSubject.subscribe(() => {
      const id = this.planId();
      if (id) {
        this.loadAnalysisData(id);
      }
    });
  }

  // Public methods to set signals
  setPlanId(id: string) {
    this.planId.set(id);
    this.isInitialized.set(false); // Reset initialization flag on new plan ID
    this.isPointsDataLoaded.set(false); // Reset points loaded flag
    // Load data immediately
    this.loadAnalysisData(id);
  }

  // Used by components to notify when point status changes
  pointStatusChanged() {
    // Don't reset the pointsDataLoaded flag to avoid unnecessary flicker
    // Just refresh the data
    const id = this.planId();
    if (id) {
      this.loadAnalysisData(id);
    }
  }

  // Load data once and update signals
  private loadAnalysisData(planId: string) {
    this.isDataLoading.set(true);
    this.isPointsDataLoaded.set(false);

    // Always get the latest user role from localStorage
    const freshRole = this.authService.refreshUserRole();
    this.currentUserRole.set(freshRole);
    console.log(
      `[AnalysisStatusService] Current user role from localStorage: ${freshRole}`
    );

    // Get stage details
    this.analysisStageService.getAnalysisStageDetails(planId).subscribe({
      next: (stageDetails) => {
        const { status } = stageDetails.data;
        this.stageStatus.set(status);

        // Check if analysis is approved
        this.isAnalysisApproved.set(
          status === ApprovalStatusEnum.ApprovedByHighManagement ||
            status === ApprovalStatusEnum.ApprovedByHighManagementPartially
        );

        // Get points list
        this.analysisStageService.getAnalysisStageLists(planId, {}).subscribe({
          next: (response) => {
            const points = response.data || [];
            console.log(
              '[AnalysisStatusService] Loaded points:',
              points.length,
              'Setting data...'
            );

            // Get user role again to ensure consistency
            const userRole = this.currentUserRole();
            console.log(
              `[AnalysisStatusService] Processing points for user role: ${userRole}`
            );

            // No special handling for High Management - all roles require proper action on points
            // We only help Region Managers who view Unit Manager approved stages
            let processedPoints = [...points];

            // Only help Region Managers with automatic point status corrections
            if (userRole === RolesEnums.RegionManager) {
              if (
                status === ApprovalStatusEnum.ApprovedByUnitManager ||
                status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
              ) {
                console.log(
                  '[AnalysisStatusService] Region Manager viewing Unit Manager approved stage'
                );

                // For Region Manager viewing Unit Manager approved stage
                processedPoints = points.map((p: any) => {
                  if (p.status === ApprovalStatusEnum.Pending) {
                    return {
                      ...p,
                      status: ApprovalStatusEnum.ApprovedByUnitManager,
                    };
                  }
                  return p;
                });
              }
            }

            // Set the processed points
            this.points.set(processedPoints);

            // Set loading to false
            this.isDataLoading.set(false);
            this.isInitialized.set(true);

            // Mark points data as loaded synchronously so the submit-button
            // gate updates in the same change-detection cycle as the data
            // (the previous setTimeout let the view render a stale value).
            this.isPointsDataLoaded.set(true);
          },
          error: (err) => {
            console.error('Error loading analysis points:', err);
            this.isDataLoading.set(false);
            this.isInitialized.set(true);
            this.isPointsDataLoaded.set(true);
          },
        });
      },
      error: (err) => {
        console.error('Error loading analysis stage details:', err);
        this.isDataLoading.set(false);
        this.isInitialized.set(true);
        this.isPointsDataLoaded.set(true);
      },
    });
  }

  // For debugging purposes - call this from the browser console to see current state
  debugState() {
    const state = {
      planId: this.planId(),
      stageStatus: this.stageStatus(),
      points: this.points(),
      userRole: this.currentUserRole(),
      canApprove: this.canApproveBasedOnRole(),
      allPointsActedUpon: this.allPointsActedUpon(),
      canShowButton: this.canShowSubmitButton(),
      buttonReason: this.buttonDisabledReason(),
      isAnalysisApproved: this.isAnalysisApproved(),
      isPointsDataLoaded: this.isPointsDataLoaded(),
      pendingPointsCount: this.countPendingPoints(),
    };

    console.table(state);

    return state;
  }

  // Helper method to count points requiring action for the current role
  countPendingPoints(): number {
    const role = this.currentUserRole();
    const points = this.points();

    if (!role || !points.length) return 0;

    if (role === RolesEnums.UnitManager) {
      // Count points that need action using the same logic as allPointsActedUpon
      return points.filter((p) => {
        // Check for all possible "acted upon" statuses
        const isActedUpon =
          // Any type of approval from Unit Manager
          p.status === ApprovalStatusEnum.ApprovedByUnitManager ||
          p.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
          // Any rejection from Unit Manager
          p.status === ApprovalStatusEnum.RejectedByUnitManager ||
          // Any approval from higher roles (Region Manager)
          p.status === ApprovalStatusEnum.ApprovedByRegionManager ||
          p.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
          // Any approval from even higher roles (High Management)
          p.status === ApprovalStatusEnum.ApprovedByHighManagement ||
          p.status === ApprovalStatusEnum.ApprovedByHighManagementPartially ||
          // Any rejection from higher roles
          p.status === ApprovalStatusEnum.RejectedByRegionManager ||
          p.status === ApprovalStatusEnum.RejectedByHighManagement;

        return !isActedUpon;
      }).length;
    } else if (role === RolesEnums.RegionManager) {
      return points.filter((p) => {
        // Check for all possible "acted upon" statuses
        const isActedUpon =
          // Any type of approval from Region Manager
          p.status === ApprovalStatusEnum.ApprovedByRegionManager ||
          p.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
          // Any rejection from Region Manager
          p.status === ApprovalStatusEnum.RejectedByRegionManager ||
          // Any rejection from Unit Manager (considered already acted upon)
          p.status === ApprovalStatusEnum.RejectedByUnitManager ||
          // Any approval from higher roles (High Management)
          p.status === ApprovalStatusEnum.ApprovedByHighManagement ||
          p.status === ApprovalStatusEnum.ApprovedByHighManagementPartially ||
          // Any rejection from higher roles
          p.status === ApprovalStatusEnum.RejectedByHighManagement;

        return !isActedUpon;
      }).length;
    } else if (role === RolesEnums.HighManagement) {
      return points.filter((p) => {
        // Check for all possible "acted upon" statuses
        const isActedUpon =
          // Any type of approval from High Management
          p.status === ApprovalStatusEnum.ApprovedByHighManagement ||
          p.status === ApprovalStatusEnum.ApprovedByHighManagementPartially ||
          // Any rejection from High Management
          p.status === ApprovalStatusEnum.RejectedByHighManagement ||
          // Any rejection from lower roles (considered already acted upon)
          p.status === ApprovalStatusEnum.RejectedByUnitManager ||
          p.status === ApprovalStatusEnum.RejectedByRegionManager;

        return !isActedUpon;
      }).length;
    }

    return 0;
  }

  // Force an immediate data refresh and return the current state
  // This should ONLY be used for debugging purposes
  forceRefreshAndGetState(): Promise<any> {
    return new Promise((resolve) => {
      if (!this.planId()) {
        resolve({
          error: 'No planId set',
        });
        return;
      }

      this.isDataLoading.set(true);
      // We don't reset isPointsDataLoaded to avoid triggering unnecessary UI updates

      this.analysisStageService
        .getAnalysisStageDetails(this.planId()!)
        .subscribe({
          next: (stageDetails) => {
            const { status } = stageDetails.data;
            this.stageStatus.set(status);

            // Check if analysis is approved
            this.isAnalysisApproved.set(
              status === ApprovalStatusEnum.ApprovedByHighManagement ||
                status === ApprovalStatusEnum.ApprovedByHighManagementPartially
            );

            this.analysisStageService
              .getAnalysisStageLists(this.planId()!, {})
              .subscribe({
                next: (response) => {
                  const points = response.data || [];
                  this.points.set(points);
                  this.isDataLoading.set(false);

                  // Return the current state immediately without timeouts
                  resolve({
                    planId: this.planId(),
                    stageStatus: this.stageStatus(),
                    pointCount: points.length,
                    userRole: this.currentUserRole(),
                    canApprove: this.canApproveBasedOnRole(),
                    allPointsActedUpon: this.allPointsActedUpon(),
                    canShowButton: this.canShowSubmitButton(),
                    buttonReason: this.buttonDisabledReason(),
                    isAnalysisApproved: this.isAnalysisApproved(),
                    isPointsDataLoaded: this.isPointsDataLoaded(),
                    pendingPointsCount: this.countPendingPoints(),
                    points: points.map((p: any) => ({
                      id: p.id,
                      status: p.status,
                    })),
                  });
                },
                error: (err) => {
                  console.error('Error loading analysis points:', err);
                  this.isDataLoading.set(false);
                  resolve({
                    error: 'Failed to load points',
                    details: err,
                  });
                },
              });
          },
          error: (err) => {
            console.error('Error loading analysis stage details:', err);
            this.isDataLoading.set(false);
            resolve({
              error: 'Failed to load stage details',
              details: err,
            });
          },
        });
    });
  }

  // Update a specific point's status in the signal store without API call
  updatePointStatus(
    pointId: string | number,
    newStatus: ApprovalStatusEnum
  ): void {
    // We don't need to set isPointsDataLoaded to false here since we're just updating locally
    const currentPoints = this.points();
    if (!currentPoints.length) return;

    const updatedPoints = currentPoints.map((point) =>
      point.id === pointId ? { ...point, status: newStatus } : point
    );

    // Add a log to verify the update is happening correctly
    console.log('[AnalysisStatusService] Updating point status:', {
      pointId,
      newStatus,
      totalPoints: currentPoints.length,
      updatedPoints: updatedPoints.length,
    });

    // Setting the signal triggers the computed gate to re-evaluate.
    this.points.set(updatedPoints);
  }

  // A direct debug method to call from browser console to debug point status issue
  debugPointStatuses(): void {
    const points = this.points();
    const ApprovalStatusEnumValues = Object.values(ApprovalStatusEnum);

    console.log(
      '[AnalysisStatusService] Available ApprovalStatusEnum values:',
      ApprovalStatusEnumValues
    );

    // Check all points with their statuses
    console.log('[AnalysisStatusService] All points with status check:');

    points.forEach((point) => {
      const status = point.status;
      console.log(`Point ID ${point.id}, Status: ${status}`);

      // Check all possible enum values
      ApprovalStatusEnumValues.forEach((enumValue) => {
        const isMatch = status === enumValue;
        if (isMatch) {
          console.log(`  ✓ Matches enum value: ${enumValue}`);
        }
      });

      // Direct check for specific statuses
      const specificChecks = {
        isPending: status === ApprovalStatusEnum.Pending,
        isApprovedByUnitManager:
          status === ApprovalStatusEnum.ApprovedByUnitManager,
        isApprovedByUnitManagerPartially:
          status === ApprovalStatusEnum.ApprovedByUnitManagerPartially,
        isRejectedByUnitManager:
          status === ApprovalStatusEnum.RejectedByUnitManager,
        isReturnedByUnitManager:
          status === ApprovalStatusEnum.ReturnedByUnitManager,
        isApprovedByRegionManager:
          status === ApprovalStatusEnum.ApprovedByRegionManager,
        isApprovedByRegionManagerPartially:
          status === ApprovalStatusEnum.ApprovedByRegionManagerPartially,
        isRejectedByRegionManager:
          status === ApprovalStatusEnum.RejectedByRegionManager,
        isReturnedByRegionManager:
          status === ApprovalStatusEnum.ReturnedByRegionManager,
        isApprovedByHighManagement:
          status === ApprovalStatusEnum.ApprovedByHighManagement,
        isApprovedByHighManagementPartially:
          status === ApprovalStatusEnum.ApprovedByHighManagementPartially,
        isRejectedByHighManagement:
          status === ApprovalStatusEnum.RejectedByHighManagement,
        isReturnedByHighManagement:
          status === ApprovalStatusEnum.ReturnedByHighManagement,
      };

      console.log('  Specific status checks:', specificChecks);

      // Fix check: Check exact string value for problematic point
      if (point.id === 40) {
        console.log('  Special debugging for point 40:');
        console.log(`  Status value: "${status}"`);
        console.log(
          `  Exact match 'ApprovedByUnitManagerPartially': "${status === 'ApprovedByUnitManagerPartially'}"`
        );
        console.log(
          `  Enum match ApprovalStatusEnum.ApprovedByUnitManagerPartially: "${status === ApprovalStatusEnum.ApprovedByUnitManagerPartially}"`
        );

        // Try to fix if needed
        if (
          status === 'ApprovedByUnitManagerPartially' &&
          status !== ApprovalStatusEnum.ApprovedByUnitManagerPartially
        ) {
          console.log('  Attempting to fix point 40 status...');
          this.updatePointStatus(
            point.id,
            ApprovalStatusEnum.ApprovedByUnitManagerPartially
          );
        }
      }
    });

    // Force refresh after debugging
    setTimeout(() => {
      console.log('[AnalysisStatusService] Refreshing after debug...');
      this.pointStatusChanged();
    }, 500);
  }
}
