import {
  Injectable,
  Signal,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { StrategicDirectionService } from './strategic-direction.service';
import {
  ApprovalStatusEnum,
  RejectionStatuses,
  ReturnedStatuses,
  RolesEnums,
} from '../../../Core/utilities/consts';
import { AuthService } from '../../auth/services/auth.service';
import { RolePermissionsService } from '../../../Core/Service/role-permissions.service';
import { BehaviorSubject } from 'rxjs';

/**
 * Service responsible for tracking and computing strategic direction item status
 * to determine when approval buttons should be shown
 */
@Injectable({
  providedIn: 'root',
})
export class DirectionStatusService {
  private readonly strategicDirectionService = inject(
    StrategicDirectionService
  );
  private readonly authService = inject(AuthService);
  private readonly rolePermissions = inject(RolePermissionsService);

  // Subject to trigger data refresh
  private refreshSubject = new BehaviorSubject<void>(undefined);

  // State signals
  private planId: WritableSignal<string | null> = signal(null);
  private _points: WritableSignal<any[]> = signal([]);
  private _items: WritableSignal<any[]> = signal([]); // Add main items tracking
  private _isDirectionApproved: WritableSignal<boolean> = signal(false);
  private _stageStatus: WritableSignal<string | null> = signal(null);
  private _isDataLoading: WritableSignal<boolean> = signal(false);
  private _isDirectionDataLoaded: WritableSignal<boolean> = signal(false);
  private _initialized: WritableSignal<boolean> = signal(false);

  // Derived signals
  private currentUserRole = signal<RolesEnums | null>(
    this.authService.getUserRole()
  );

  // Computed signals
  readonly canApproveBasedOnRole: Signal<boolean> = computed(() => {
    const userRole = this.currentUserRole();
    const stageStatus = this._stageStatus();
    const points = this._points();

    if (!userRole || !stageStatus || !this._isDirectionDataLoaded()) {
      return false;
    }

    // Check if the current user has already approved this stage
    if (userRole === RolesEnums.UnitManager) {
      // Unit Manager cannot approve again if stage is already approved by them
      if (
        stageStatus === ApprovalStatusEnum.ApprovedByUnitManager ||
        stageStatus === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      ) {
        return false;
      }
    } else if (userRole === RolesEnums.RegionManager) {
      // Region Manager cannot approve again if stage is already approved by them
      if (
        stageStatus === ApprovalStatusEnum.ApprovedByRegionManager ||
        stageStatus === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      ) {
        return false;
      }
    } else if (userRole === RolesEnums.HighManagement) {
      // High Management cannot approve again if stage is already approved by them
      if (
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially
      ) {
        return false;
      }
    }

    // For mixed scenarios, we need to check individual item and point statuses rather than just stage status
    const items = this._items(); // Main items

    if (userRole === RolesEnums.UnitManager) {
      // Unit Manager CANNOT approve if stage has already progressed beyond their level
      // (unless it was specifically returned to them)
      const stageProgressedBeyondUnitManager =
        stageStatus === ApprovalStatusEnum.ApprovedByRegionManager ||
        stageStatus === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially;

      const isStageReturnedToUnitManager =
        stageStatus === ApprovalStatusEnum.ReturnedByRegionManager ||
        stageStatus === ApprovalStatusEnum.ReturnedByHighManagement;

      // If stage has progressed beyond Unit Manager and was NOT returned, they cannot approve
      if (stageProgressedBeyondUnitManager && !isStageReturnedToUnitManager) {
        return false;
      }

      // Unit Manager can approve if there are any pending items or points that need action
      const pendingItems = items.filter((i) => {
        return (
          i.status === ApprovalStatusEnum.Pending || i.status === 'Pending'
        );
      });

      const pendingPoints = points.filter((p) => {
        return (
          p.status === ApprovalStatusEnum.Pending || p.status === 'Pending'
        );
      });

      // Unit Manager can approve if they have approved items or points (even if they rejected some)
      const hasApprovedItems = items.some((i) => {
        return (
          i.status === ApprovalStatusEnum.ApprovedByUnitManager ||
          i.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
        );
      });

      const hasApprovedPoints = points.some((p) => {
        return (
          p.status === ApprovalStatusEnum.ApprovedByUnitManager ||
          p.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
        );
      });

      // Unit Manager can approve if:
      // 1. There are pending items or points to act on, OR
      // 2. Stage was returned by higher management, OR
      // 3. They have approved some items or points (can submit stage with approved items)
      return (
        pendingItems.length > 0 ||
        pendingPoints.length > 0 ||
        isStageReturnedToUnitManager ||
        hasApprovedItems ||
        hasApprovedPoints
      );
    }

    if (userRole === RolesEnums.RegionManager) {
      // Region Manager CANNOT approve if stage has already progressed beyond their level
      // (unless it was specifically returned to them)
      const stageProgressedBeyondRegionManager =
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially;

      const isStageReturnedToRegionManager =
        stageStatus === ApprovalStatusEnum.ReturnedByHighManagement;

      // If stage has progressed beyond Region Manager and was NOT returned, they cannot approve
      if (
        stageProgressedBeyondRegionManager &&
        !isStageReturnedToRegionManager
      ) {
        return false;
      }

      // Check if there are any items or points approved by Unit Manager that are ready for Region Manager action
      const itemsReadyForRegionManager = items.filter((i) => {
        return (
          i.status === ApprovalStatusEnum.ApprovedByUnitManager ||
          i.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
        );
      });

      const pointsReadyForRegionManager = points.filter((p) => {
        return (
          p.status === ApprovalStatusEnum.ApprovedByUnitManager ||
          p.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
        );
      });

      // Check if Region Manager has already approved items/points (can submit stage)
      const hasApprovedItems = items.some((i) => {
        return (
          i.status === ApprovalStatusEnum.ApprovedByRegionManager ||
          i.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
        );
      });

      const hasApprovedPoints = points.some((p) => {
        return (
          p.status === ApprovalStatusEnum.ApprovedByRegionManager ||
          p.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
        );
      });

      // Region Manager can approve if:
      // 1. There are items or points ready for action, OR
      // 2. They have already approved some items/points (can submit stage)
      return (
        itemsReadyForRegionManager.length > 0 ||
        pointsReadyForRegionManager.length > 0 ||
        hasApprovedItems ||
        hasApprovedPoints
      );
    }

    if (userRole === RolesEnums.HighManagement) {
      // Check if there are any items or points approved by Region Manager (ready for action)
      const itemsReadyForHighManagement = items.filter((i) => {
        return (
          i.status === ApprovalStatusEnum.ApprovedByRegionManager ||
          i.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
        );
      });

      const pointsReadyForHighManagement = points.filter((p) => {
        return (
          p.status === ApprovalStatusEnum.ApprovedByRegionManager ||
          p.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
        );
      });

      // Check if High Management has already approved items/points (can submit stage)
      const hasApprovedItems = items.some((i) => {
        return (
          i.status === ApprovalStatusEnum.ApprovedByHighManagement ||
          i.status === ApprovalStatusEnum.ApprovedByHighManagementPartially
        );
      });

      const hasApprovedPoints = points.some((p) => {
        return (
          p.status === ApprovalStatusEnum.ApprovedByHighManagement ||
          p.status === ApprovalStatusEnum.ApprovedByHighManagementPartially
        );
      });

      // High Management can approve if:
      // 1. There are items or points ready for action, OR
      // 2. They have already approved some items/points (can submit stage)
      return (
        itemsReadyForHighManagement.length > 0 ||
        pointsReadyForHighManagement.length > 0 ||
        hasApprovedItems ||
        hasApprovedPoints
      );
    }

    return false;
  });

  /**
   * Signal computed to check if all items have been acted upon by the current role
   * This checks all points within all direction items to ensure all have appropriate status
   */
  readonly allItemsActedUpon: Signal<boolean> = computed(() => {
    const userRole = this.currentUserRole();
    const points = this._points(); // Elements
    const items = this._items(); // Main items

    if (!userRole || !this._isDirectionDataLoaded()) {
      return false;
    }

    // Must have both items and elements to proceed
    if (items.length === 0 && points.length === 0) {
      return false;
    }

    // Hard guard: a rejected or returned item/element (at any level) blocks the
    // stage from being submitted until it is reworked and re-approved.
    if (
      items.some(
        (i) =>
          RejectionStatuses.includes(i.status) ||
          ReturnedStatuses.includes(i.status)
      ) ||
      points.some(
        (p) =>
          RejectionStatuses.includes(p.status) ||
          ReturnedStatuses.includes(p.status)
      )
    ) {
      return false;
    }

    let allActedUpon = false;

    if (userRole === RolesEnums.UnitManager) {
      // Check if any items or points are in "returned" status - these need edits before approval
      // Returned or rejected items/elements (any level) block stage submission.
      const hasReturnedItems = items.some(
        (i) =>
          ReturnedStatuses.includes(i.status) ||
          RejectionStatuses.includes(i.status)
      );
      const hasReturnedPoints = points.some(
        (p) =>
          ReturnedStatuses.includes(p.status) ||
          RejectionStatuses.includes(p.status)
      );

      if (hasReturnedItems || hasReturnedPoints) {
        allActedUpon = false;
      } else {
        // Check main items that need action
        const pendingItems = items.filter((i) => {
          const isActedUpon =
            i.status === ApprovalStatusEnum.ApprovedByUnitManager ||
            i.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
            i.status === ApprovalStatusEnum.RejectedByUnitManager ||
            i.status === ApprovalStatusEnum.ApprovedByRegionManager ||
            i.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
            i.status === ApprovalStatusEnum.ApprovedByHighManagement ||
            i.status === ApprovalStatusEnum.ApprovedByHighManagementPartially ||
            i.status === ApprovalStatusEnum.RejectedByRegionManager ||
            i.status === ApprovalStatusEnum.RejectedByHighManagement;
          return !isActedUpon;
        });

        // Check elements that need action
        const pendingPoints = points.filter((p) => {
          const isActedUpon =
            p.status === ApprovalStatusEnum.ApprovedByUnitManager ||
            p.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
            p.status === ApprovalStatusEnum.RejectedByUnitManager ||
            p.status === ApprovalStatusEnum.ApprovedByRegionManager ||
            p.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
            p.status === ApprovalStatusEnum.ApprovedByHighManagement ||
            p.status === ApprovalStatusEnum.ApprovedByHighManagementPartially ||
            p.status === ApprovalStatusEnum.RejectedByRegionManager ||
            p.status === ApprovalStatusEnum.RejectedByHighManagement;
          return !isActedUpon;
        });

        // ALL items AND elements must be acted upon
        allActedUpon = pendingItems.length === 0 && pendingPoints.length === 0;

        console.log('[DirectionStatusService] Unit Manager analysis:', {
          totalItems: items.length,
          totalPoints: points.length,
          pendingItems: pendingItems.length,
          pendingPoints: pendingPoints.length,
          allActedUpon,
          hasReturnedItems,
          hasReturnedPoints,
          pendingItemsList: pendingItems.map((i) => ({
            id: i.id,
            status: i.status,
            type: i.type,
          })),
          pendingPointsList: pendingPoints.map((p) => ({
            id: p.id,
            status: p.status,
          })),
        });
      }
    } else if (userRole === RolesEnums.RegionManager) {
      // Check if any items or points are in "returned" status
      // Returned or rejected items/elements (any level) block stage submission.
      const hasReturnedItems = items.some(
        (i) =>
          ReturnedStatuses.includes(i.status) ||
          RejectionStatuses.includes(i.status)
      );
      const hasReturnedPoints = points.some(
        (p) =>
          ReturnedStatuses.includes(p.status) ||
          RejectionStatuses.includes(p.status)
      );

      if (hasReturnedItems || hasReturnedPoints) {
        allActedUpon = false;
      } else {
        // For Region Manager: Items/points that were approved by Unit Manager OR already acted upon by Region Manager
        const itemsReadyForRegionManager = items.filter((i) => {
          return (
            i.status === ApprovalStatusEnum.ApprovedByUnitManager ||
            i.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
          );
        });

        const pointsReadyForRegionManager = points.filter((p) => {
          return (
            p.status === ApprovalStatusEnum.ApprovedByUnitManager ||
            p.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
          );
        });

        // Items/points that Region Manager has already acted upon
        const itemsActedUponByRegionManager = items.filter((i) => {
          return (
            i.status === ApprovalStatusEnum.ApprovedByRegionManager ||
            i.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
            i.status === ApprovalStatusEnum.RejectedByRegionManager
          );
        });

        const pointsActedUponByRegionManager = points.filter((p) => {
          return (
            p.status === ApprovalStatusEnum.ApprovedByRegionManager ||
            p.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
            p.status === ApprovalStatusEnum.RejectedByRegionManager
          );
        });

        // Get items that still need action from Region Manager
        const pendingItems = itemsReadyForRegionManager.filter((i) => {
          const isActedUponByRegionManager =
            i.status === ApprovalStatusEnum.ApprovedByRegionManager ||
            i.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
            i.status === ApprovalStatusEnum.RejectedByRegionManager ||
            i.status === ApprovalStatusEnum.ApprovedByHighManagement ||
            i.status === ApprovalStatusEnum.ApprovedByHighManagementPartially ||
            i.status === ApprovalStatusEnum.RejectedByHighManagement;
          return !isActedUponByRegionManager;
        });

        // Get points that still need action from Region Manager
        const pendingPoints = pointsReadyForRegionManager.filter((p) => {
          const isActedUponByRegionManager =
            p.status === ApprovalStatusEnum.ApprovedByRegionManager ||
            p.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
            p.status === ApprovalStatusEnum.RejectedByRegionManager ||
            p.status === ApprovalStatusEnum.ApprovedByHighManagement ||
            p.status === ApprovalStatusEnum.ApprovedByHighManagementPartially ||
            p.status === ApprovalStatusEnum.RejectedByHighManagement;
          return !isActedUponByRegionManager;
        });

        // All items AND points ready for Region Manager have been acted upon
        // Consider both items ready for action AND items already acted upon
        const hasItemsOrPointsReady =
          itemsReadyForRegionManager.length > 0 ||
          pointsReadyForRegionManager.length > 0 ||
          itemsActedUponByRegionManager.length > 0 ||
          pointsActedUponByRegionManager.length > 0;

        allActedUpon =
          hasItemsOrPointsReady &&
          pendingItems.length === 0 &&
          pendingPoints.length === 0;

        console.log('[DirectionStatusService] Region Manager analysis:', {
          totalItems: items.length,
          totalPoints: points.length,
          itemsReadyForRegionManager: itemsReadyForRegionManager.length,
          pointsReadyForRegionManager: pointsReadyForRegionManager.length,
          itemsActedUponByRegionManager: itemsActedUponByRegionManager.length,
          pointsActedUponByRegionManager: pointsActedUponByRegionManager.length,
          pendingItems: pendingItems.length,
          pendingPoints: pendingPoints.length,
          allActedUpon,
          hasItemsOrPointsReady,
        });
      }
    } else if (userRole === RolesEnums.HighManagement) {
      // Check if any items or points are in "returned" status
      // Returned or rejected items/elements (any level) block stage submission.
      const hasReturnedItems = items.some(
        (i) =>
          ReturnedStatuses.includes(i.status) ||
          RejectionStatuses.includes(i.status)
      );
      const hasReturnedPoints = points.some(
        (p) =>
          ReturnedStatuses.includes(p.status) ||
          RejectionStatuses.includes(p.status)
      );

      if (hasReturnedItems || hasReturnedPoints) {
        allActedUpon = false;
      } else {
        // Get items that need action
        const pendingItems = items.filter((i) => {
          const isActedUpon =
            i.status === ApprovalStatusEnum.ApprovedByHighManagement ||
            i.status === ApprovalStatusEnum.ApprovedByHighManagementPartially ||
            i.status === ApprovalStatusEnum.RejectedByHighManagement ||
            i.status === ApprovalStatusEnum.RejectedByUnitManager ||
            i.status === ApprovalStatusEnum.RejectedByRegionManager;
          return !isActedUpon;
        });

        // Get points that need action
        const pendingPoints = points.filter((p) => {
          const isActedUpon =
            p.status === ApprovalStatusEnum.ApprovedByHighManagement ||
            p.status === ApprovalStatusEnum.ApprovedByHighManagementPartially ||
            p.status === ApprovalStatusEnum.RejectedByHighManagement ||
            p.status === ApprovalStatusEnum.RejectedByUnitManager ||
            p.status === ApprovalStatusEnum.RejectedByRegionManager;
          return !isActedUpon;
        });

        // ALL items AND points must be acted upon
        allActedUpon = pendingItems.length === 0 && pendingPoints.length === 0;
      }
    }

    return allActedUpon;
  });

  readonly buttonDisabledReason: Signal<string> = computed(() => {
    const userRole = this.currentUserRole();
    const canApprove = this.canApproveBasedOnRole();
    const allItemsActed = this.allItemsActedUpon();
    const points = this._points();
    const stageStatus = this._stageStatus();
    const items = this._items(); // Main items

    if (!this._isDirectionDataLoaded()) {
      return 'جاري تحميل البيانات...';
    }

    // Check if direction is already fully approved
    if (
      stageStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
      stageStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially
    ) {
      return 'تم الموافقة على التوجه الاستراتيجي بنجاح';
    }

    if (!userRole || userRole === RolesEnums.UnitEmployee) {
      return 'بعد الانتهاء من إضافة جميع عناصر التوجه الاستراتيجي، سيقوم مدير الوحدة بمراجعتها';
    }

    if (points.length === 0 && items.length === 0) {
      return 'لا توجد عناصر للتوجه الاستراتيجي. يرجى إضافة عناصر جديدة.';
    }

    // Check for returned items/points that need editing
    if (userRole === RolesEnums.UnitManager) {
      const returnedItems = items.filter(
        (i) => i.status === ApprovalStatusEnum.ReturnedByUnitManager
      );
      const returnedPoints = points.filter(
        (p) => p.status === ApprovalStatusEnum.ReturnedByUnitManager
      );

      if (returnedItems.length > 0 || returnedPoints.length > 0) {
        const totalReturned = returnedItems.length + returnedPoints.length;
        return `يوجد ${totalReturned} ${totalReturned === 1 ? 'عنصر تم إعادته' : 'عناصر تم إعادتها'} وتحتاج للتعديل من قبل الموظفين قبل استكمال الإجراءات`;
      }

      // Special message for stage returned by Region Manager or High Management
      if (
        stageStatus === ApprovalStatusEnum.ReturnedByRegionManager ||
        stageStatus === ApprovalStatusEnum.ReturnedByHighManagement
      ) {
        const pendingItemsCount = items.filter(
          (i) =>
            i.status === ApprovalStatusEnum.Pending || i.status === 'Pending'
        ).length;
        const pendingPointsCount = points.filter(
          (p) =>
            p.status === ApprovalStatusEnum.Pending || p.status === 'Pending'
        ).length;
        const totalPending = pendingItemsCount + pendingPointsCount;

        if (totalPending > 0) {
          return `يجب اتخاذ إجراء على ${totalPending} ${totalPending === 1 ? 'عنصر متبقي' : 'عناصر متبقية'} قبل إعادة الإرسال إلى المستوى التالي`;
        }

        // If button is visible (all items acted upon) - no need for a message
        if (this.canShowSubmitButton()) {
          return '';
        }

        return 'يمكنك إعادة إرسال المرحلة بعد معالجة العناصر المُعادة';
      }
    } else if (userRole === RolesEnums.RegionManager) {
      const returnedItems = items.filter(
        (i) => i.status === ApprovalStatusEnum.ReturnedByRegionManager
      );
      const returnedPoints = points.filter(
        (p) => p.status === ApprovalStatusEnum.ReturnedByRegionManager
      );

      if (returnedItems.length > 0 || returnedPoints.length > 0) {
        const totalReturned = returnedItems.length + returnedPoints.length;
        return `يوجد ${totalReturned} ${totalReturned === 1 ? 'عنصر تم إعادته' : 'عناصر تم إعادتها'} وتحتاج للتعديل من قبل الموظفين قبل استكمال الإجراءات`;
      }

      // Special message for stage returned by High Management
      if (stageStatus === ApprovalStatusEnum.ReturnedByHighManagement) {
        const pendingItemsCount = items.filter(
          (i) =>
            i.status === ApprovalStatusEnum.Pending || i.status === 'Pending'
        ).length;
        const pendingPointsCount = points.filter(
          (p) =>
            p.status === ApprovalStatusEnum.Pending || p.status === 'Pending'
        ).length;
        const totalPending = pendingItemsCount + pendingPointsCount;

        if (totalPending > 0) {
          return `يجب اتخاذ إجراء على ${totalPending} ${totalPending === 1 ? 'عنصر متبقي' : 'عناصر متبقية'} قبل إعادة الإرسال إلى الإدارة العليا`;
        }

        // If button is visible (all items acted upon) - no need for a message
        if (this.canShowSubmitButton()) {
          return '';
        }

        return 'يمكنك إعادة إرسال المرحلة بعد معالجة العناصر المُعادة من الإدارة العليا';
      }
    } else if (userRole === RolesEnums.HighManagement) {
      const returnedItems = items.filter(
        (i) => i.status === ApprovalStatusEnum.ReturnedByHighManagement
      );
      const returnedPoints = points.filter(
        (p) => p.status === ApprovalStatusEnum.ReturnedByHighManagement
      );

      if (returnedItems.length > 0 || returnedPoints.length > 0) {
        const totalReturned = returnedItems.length + returnedPoints.length;
        return `يوجد ${totalReturned} ${totalReturned === 1 ? 'عنصر تم إعادته' : 'عناصر تم إعادتها'} وتحتاج للتعديل من قبل الموظفين قبل استكمال الإجراءات`;
      }
    }

    if (!canApprove) {
      // Provide more specific messages based on the current stage status
      if (stageStatus === ApprovalStatusEnum.Pending) {
        if (
          userRole === RolesEnums.RegionManager ||
          userRole === RolesEnums.HighManagement
        ) {
          return 'المرحلة الحالية: في انتظار موافقة مدير الوحدة';
        }
      } else if (
        stageStatus === ApprovalStatusEnum.ApprovedByUnitManager ||
        stageStatus === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      ) {
        if (userRole === RolesEnums.UnitManager) {
          return 'تم الموافقة من قبل مدير الوحدة وفي انتظار موافقة مدير المنطقة';
        } else if (userRole === RolesEnums.HighManagement) {
          return 'المرحلة الحالية: في انتظار موافقة مدير المنطقة';
        }
      } else if (
        stageStatus === ApprovalStatusEnum.ApprovedByRegionManager ||
        stageStatus === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      ) {
        if (
          userRole === RolesEnums.UnitManager ||
          userRole === RolesEnums.RegionManager
        ) {
          return 'تم الموافقة من قبل مدير المنطقة وفي انتظار موافقة الإدارة العليا';
        }
      } else if (stageStatus === ApprovalStatusEnum.RejectedByUnitManager) {
        return 'تم رفض هذه المرحلة من قبل مدير الوحدة';
      } else if (stageStatus === ApprovalStatusEnum.RejectedByRegionManager) {
        return 'تم رفض هذه المرحلة من قبل مدير المنطقة';
      } else if (stageStatus === ApprovalStatusEnum.RejectedByHighManagement) {
        return 'تم رفض هذه المرحلة من قبل الإدارة العليا';
      } else if (stageStatus === ApprovalStatusEnum.ReturnedByUnitManager) {
        return 'تم إعادة هذه المرحلة من قبل مدير الوحدة';
      } else if (stageStatus === ApprovalStatusEnum.ReturnedByRegionManager) {
        if (userRole === RolesEnums.UnitManager) {
          return 'بعد مراجعة العناصر المعادة، يمكنك إعادة إرسال المرحلة إلى مدير المنطقة';
        } else {
          return 'تم إعادة هذه المرحلة من قبل مدير المنطقة';
        }
      } else if (stageStatus === ApprovalStatusEnum.ReturnedByHighManagement) {
        if (userRole === RolesEnums.UnitManager) {
          return 'بعد مراجعة العناصر المعادة، يمكنك إعادة إرسال المرحلة';
        } else if (userRole === RolesEnums.RegionManager) {
          return 'بعد مراجعة العناصر المعادة، يمكنك إعادة إرسال المرحلة إلى الإدارة العليا';
        } else {
          return 'تم إعادة هذه المرحلة من قبل الإدارة العليا';
        }
      }

      return 'لا يمكنك الموافقة على المرحلة في هذه الحالة';
    }

    if (!allItemsActed) {
      // Find items that need action
      const itemsNeedingAction = items.filter((item) => {
        if (userRole === RolesEnums.UnitManager) {
          // Unit Manager needs to act on pending items only
          return (
            item.status === ApprovalStatusEnum.Pending ||
            item.status === 'Pending'
          );
        } else if (userRole === RolesEnums.RegionManager) {
          // For Region Manager: Only items approved by Unit Manager need action
          const isReadyForRegionManager =
            item.status === ApprovalStatusEnum.ApprovedByUnitManager ||
            item.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially;

          const isAlreadyActedUponByRegionManager =
            item.status === ApprovalStatusEnum.ApprovedByRegionManager ||
            item.status ===
              ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
            item.status === ApprovalStatusEnum.RejectedByRegionManager ||
            item.status === ApprovalStatusEnum.ApprovedByHighManagement ||
            item.status ===
              ApprovalStatusEnum.ApprovedByHighManagementPartially ||
            item.status === ApprovalStatusEnum.RejectedByHighManagement;

          return isReadyForRegionManager && !isAlreadyActedUponByRegionManager;
        } else if (userRole === RolesEnums.HighManagement) {
          return (
            item.status !== ApprovalStatusEnum.ApprovedByHighManagement &&
            item.status !==
              ApprovalStatusEnum.ApprovedByHighManagementPartially &&
            item.status !== ApprovalStatusEnum.RejectedByHighManagement &&
            item.status !== ApprovalStatusEnum.RejectedByUnitManager &&
            item.status !== ApprovalStatusEnum.RejectedByRegionManager
          );
        }
        return false;
      });

      // Find elements that need action
      const elementsNeedingAction = points.filter((point) => {
        if (userRole === RolesEnums.UnitManager) {
          // Unit Manager needs to act on pending points only
          return (
            point.status === ApprovalStatusEnum.Pending ||
            point.status === 'Pending'
          );
        } else if (userRole === RolesEnums.RegionManager) {
          // For Region Manager: Only items approved by Unit Manager need action
          // Items rejected by Unit Manager are not actionable by Region Manager
          const isReadyForRegionManager =
            point.status === ApprovalStatusEnum.ApprovedByUnitManager ||
            point.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially;

          const isAlreadyActedUponByRegionManager =
            point.status === ApprovalStatusEnum.ApprovedByRegionManager ||
            point.status ===
              ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
            point.status === ApprovalStatusEnum.RejectedByRegionManager ||
            point.status === ApprovalStatusEnum.ApprovedByHighManagement ||
            point.status ===
              ApprovalStatusEnum.ApprovedByHighManagementPartially ||
            point.status === ApprovalStatusEnum.RejectedByHighManagement;

          // Return true if this point needs action (ready but not acted upon)
          return isReadyForRegionManager && !isAlreadyActedUponByRegionManager;
        } else if (userRole === RolesEnums.HighManagement) {
          return (
            point.status !== ApprovalStatusEnum.ApprovedByHighManagement &&
            point.status !==
              ApprovalStatusEnum.ApprovedByHighManagementPartially &&
            point.status !== ApprovalStatusEnum.RejectedByHighManagement &&
            point.status !== ApprovalStatusEnum.RejectedByUnitManager &&
            point.status !== ApprovalStatusEnum.RejectedByRegionManager
          );
        }
        return false;
      });

      // Combine items and elements that need action
      const allNeedingAction = [
        ...itemsNeedingAction,
        ...elementsNeedingAction,
      ];

      // Helper function to get a meaningful name for an element
      const getElementName = (element: any): string => {
        // Try different possible name fields
        if (element.name && element.name.trim()) {
          return element.name.trim();
        }
        if (element.value && element.value.trim()) {
          return element.value.trim();
        }
        if (element.content && element.content.trim()) {
          return element.content.trim();
        }

        // If it's a main item, use type-based naming
        if (element.type) {
          const typeNames: Record<string, string> = {
            Vision: 'الرؤية',
            Message: 'الرسالة',
            Value: 'القيم',
          };
          return typeNames[element.type] || element.type;
        }

        // Last resort - use ID if available
        if (element.id) {
          return `عنصر رقم ${element.id}`;
        }

        return 'عنصر';
      };

      if (allNeedingAction.length === 0) {
        return '';
      }

      const elementNames =
        allNeedingAction.length <= 3
          ? allNeedingAction.map(getElementName).join(', ')
          : `${allNeedingAction.length} عناصر`;

      return `يرجى اتخاذ إجراء على العناصر التالية: ${elementNames}`;
    }

    return '';
  });

  readonly canShowSubmitButton: Signal<boolean> = computed(() => {
    const userRole = this.currentUserRole();
    const points = this._points();
    const items = this._items();
    const stageStatus = this._stageStatus();

    // No items or points, no button
    if (items.length === 0 && points.length === 0) {
      return false;
    }

    // If direction is already fully approved, don't show the button
    if (
      stageStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
      stageStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially
    ) {
      return false;
    }

    if (userRole === RolesEnums.UnitManager) {
      // Unit Manager can submit only if:
      // 1. There are items/points
      // 2. All items/points have been approved by unit manager (or have partial approval statuses)
      // 3. Stage hasn't been submitted yet by unit manager (original first-time approval logic)

      // If stage is already approved by unit manager or beyond, hide button (use resubmit button instead)
      if (
        stageStatus === ApprovalStatusEnum.ApprovedByUnitManager ||
        stageStatus === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
        stageStatus === ApprovalStatusEnum.ApprovedByRegionManager ||
        stageStatus === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially
      ) {
        return false;
      }

      // Check if all items are approved by unit manager
      const allItemsApprovedByUnitManager = items.every(
        (item) =>
          item.status === ApprovalStatusEnum.ApprovedByUnitManager ||
          item.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      );

      // Check if all points are approved by unit manager
      const allPointsApprovedByUnitManager = points.every(
        (point) =>
          point.status === ApprovalStatusEnum.ApprovedByUnitManager ||
          point.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      );

      const result =
        allItemsApprovedByUnitManager && allPointsApprovedByUnitManager;

      // For partial approval scenario: Only show button if there are partial approvals
      // AND all items/points have been acted upon (no pending items)
      if (!result) {
        const hasPartialApprovals = this.hasPartialApprovalStatuses();
        const allItemsActedUpon = this.allItemsActedUpon();

        // Show button only if there are partial approvals AND all items have been acted upon
        if (hasPartialApprovals && allItemsActedUpon) {
          console.log(
            '[DirectionStatusService] Unit Manager button shown due to partial approvals with all items acted upon:',
            {
              hasPartialApprovals,
              allItemsActedUpon,
              stageStatus,
            }
          );
          return true;
        }
      }

      return result;
    }

    if (userRole === RolesEnums.RegionManager) {
      // Region Manager can submit only if:
      // 1. There are items/points
      // 2. All items/points have been approved by region manager
      // 3. Stage hasn't been submitted yet by region manager

      // If stage is already approved by region manager or beyond, hide button
      if (
        stageStatus === ApprovalStatusEnum.ApprovedByRegionManager ||
        stageStatus === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially
      ) {
        return false;
      }

      // Only show if stage is approved by unit manager and waiting for region manager
      if (
        stageStatus !== ApprovalStatusEnum.ApprovedByUnitManager &&
        stageStatus !== ApprovalStatusEnum.ApprovedByUnitManagerPartially
      ) {
        return false;
      }

      // Check if all items are approved by region manager
      const allItemsApprovedByRegionManager = items.every(
        (item) =>
          item.status === ApprovalStatusEnum.ApprovedByRegionManager ||
          item.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      );

      // Check if all points are approved by region manager
      const allPointsApprovedByRegionManager = points.every(
        (point) =>
          point.status === ApprovalStatusEnum.ApprovedByRegionManager ||
          point.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      );

      return (
        allItemsApprovedByRegionManager && allPointsApprovedByRegionManager
      );
    }

    if (userRole === RolesEnums.HighManagement) {
      // High Management can submit only if:
      // 1. There are items/points
      // 2. All items/points have been approved by high management
      // 3. Stage hasn't been submitted yet by high management

      // If stage is already approved by high management, hide button
      if (
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        stageStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially
      ) {
        return false;
      }

      // Only show if stage is approved by region manager and waiting for high management
      if (
        stageStatus !== ApprovalStatusEnum.ApprovedByRegionManager &&
        stageStatus !== ApprovalStatusEnum.ApprovedByRegionManagerPartially
      ) {
        return false;
      }

      // Check if all items are approved by high management
      const allItemsApprovedByHighManagement = items.every(
        (item) =>
          item.status === ApprovalStatusEnum.ApprovedByHighManagement ||
          item.status === ApprovalStatusEnum.ApprovedByHighManagementPartially
      );

      // Check if all points are approved by high management
      const allPointsApprovedByHighManagement = points.every(
        (point) =>
          point.status === ApprovalStatusEnum.ApprovedByHighManagement ||
          point.status === ApprovalStatusEnum.ApprovedByHighManagementPartially
      );

      return (
        allItemsApprovedByHighManagement && allPointsApprovedByHighManagement
      );
    }

    // Default: no button for other roles
    return false;
  });

  // Public accessors as computed signals
  readonly isDirectionApproved = computed(
    () =>
      this._isDirectionApproved() ||
      this._stageStatus() === ApprovalStatusEnum.ApprovedByHighManagement ||
      this._stageStatus() ===
        ApprovalStatusEnum.ApprovedByHighManagementPartially
  );

  readonly stageStatus = computed(() => this._stageStatus());
  readonly isDataLoading = computed(() => this._isDataLoading());
  readonly isDirectionDataLoaded = computed(() =>
    this._isDirectionDataLoaded()
  );
  readonly isInitialized = computed(() => this._initialized());

  // Check if there are any points or items with partial approval statuses
  readonly hasPartialApprovalStatuses: Signal<boolean> = computed(() => {
    const points = this._points();
    const items = this._items();

    if (!this._isDirectionDataLoaded()) {
      return false;
    }

    // Check for partial approval statuses in points
    const hasPartialApprovalPoints = points.some((point: any) => {
      return (
        point.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
        point.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
        point.status === ApprovalStatusEnum.ApprovedByHighManagementPartially
      );
    });

    // Check for partial approval statuses in items
    const hasPartialApprovalItems = items.some((item: any) => {
      return (
        item.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
        item.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
        item.status === ApprovalStatusEnum.ApprovedByHighManagementPartially
      );
    });

    const result = hasPartialApprovalPoints || hasPartialApprovalItems;

    // Debug logging
    if (result) {
      console.log('[DirectionStatusService] Found partial approval statuses:', {
        hasPartialApprovalPoints,
        hasPartialApprovalItems,
        pointsWithPartialApproval: points.filter(
          (p: any) =>
            p.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
            p.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
            p.status === ApprovalStatusEnum.ApprovedByHighManagementPartially
        ),
        itemsWithPartialApproval: items.filter(
          (i: any) =>
            i.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
            i.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
            i.status === ApprovalStatusEnum.ApprovedByHighManagementPartially
        ),
      });
    }

    return result;
  });

  // Signal to check if resubmit button should be shown for Unit Manager when new items are added after approval
  readonly canShowResubmitButton: Signal<boolean> = computed(() => {
    const userRole = this.currentUserRole();
    const points = this._points();
    const items = this._items();
    const stageStatus = this._stageStatus();

    // Only for Unit Manager role
    if (userRole !== RolesEnums.UnitManager) {
      return false;
    }

    // No items or points, no button
    if (items.length === 0 && points.length === 0) {
      return false;
    }

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

    // If direction is already fully approved, don't show resubmit button
    if (
      stageStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
      stageStatus === ApprovalStatusEnum.ApprovedByHighManagementPartially
    ) {
      return false;
    }

    // Check if all current items are acted upon (no pending items)
    const allActedUpon = this.allItemsActedUpon();

    // Check if there are items that are approved by Unit Manager but stage needs re-submission
    const hasItemsApprovedByUnitManager = items.some((item) => {
      return (
        item.status === ApprovalStatusEnum.ApprovedByUnitManager ||
        item.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      );
    });

    const hasPointsApprovedByUnitManager = points.some((point) => {
      return (
        point.status === ApprovalStatusEnum.ApprovedByUnitManager ||
        point.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      );
    });

    // Show resubmit button when:
    // 1. Stage was already approved/submitted
    // 2. All current items are acted upon (no pending work)
    // 3. There are items approved by Unit Manager (indicating new items were added and approved)
    const shouldShow =
      allActedUpon &&
      (hasItemsApprovedByUnitManager || hasPointsApprovedByUnitManager);

    if (shouldShow) {
      console.log(
        '[DirectionStatusService] Unit Manager resubmit button shown - new items added after stage approval:',
        {
          stageStatus,
          allActedUpon,
          hasItemsApprovedByUnitManager,
          hasPointsApprovedByUnitManager,
          totalItems: items.length,
          totalPoints: points.length,
        }
      );
    }

    return shouldShow;
  });

  /**
   * Get points signal for direct access
   */
  get points(): WritableSignal<any[]> {
    return this._points;
  }

  constructor() {
    // Set up watcher effect for plan status changes
    effect(
      () => {
        const planIdValue = this.planId();
        if (planIdValue) {
          this.fetchDirectionStatus();
        }
      },
      { allowSignalWrites: true }
    );

    // Set up watcher for user role changes
    effect(
      () => {
        const newRole = this.authService.getUserRole();
        this.currentUserRole.set(newRole);
      },
      { allowSignalWrites: true }
    );
  }

  setPlanId(id: string) {
    this.planId.set(id);
  }

  // Method to trigger status refresh
  directionItemStatusChanged() {
    this.refreshSubject.next();
    if (this.planId()) {
      this.fetchDirectionStatus();
    }
  }

  // Method to load direction data from API
  private fetchDirectionStatus() {
    const id = this.planId();
    if (!id) return;

    this._isDataLoading.set(true);

    this.strategicDirectionService.getPlanDirection(id).subscribe({
      next: (response) => {
        if (!response || !response.data) {
          this._isDataLoading.set(false);
          return;
        }

        // Extract the status
        const { status } = response.data;

        // Check if direction is fully approved
        this._isDirectionApproved.set(
          status === ApprovalStatusEnum.ApprovedByHighManagement ||
            status === ApprovalStatusEnum.ApprovedByHighManagementPartially
        );

        this._stageStatus.set(status);

        // Extract all points from all direction items and collect main items
        let allPoints: any[] = [];
        let allItems: any[] = [];

        // Handle the new response structure with getAllDirectionDtoResponse
        if (response.data.getAllDirectionDtoResponse) {
          const visionItems =
            response.data.getAllDirectionDtoResponse.vision || [];
          const messageItems =
            response.data.getAllDirectionDtoResponse.message || [];
          const valueItems =
            response.data.getAllDirectionDtoResponse.value || [];

          // Collect all main items
          allItems = [
            ...visionItems.map((item: any) => ({ ...item, type: 'Vision' })),
            ...messageItems.map((item: any) => ({ ...item, type: 'Message' })),
            ...valueItems.map((item: any) => ({ ...item, type: 'Value' })),
          ];

          // Collect all elements from all items
          const extractElementsFromItems = (items: any[]) => {
            return items.reduce((acc, item) => {
              if (
                item.directionItemsElements &&
                Array.isArray(item.directionItemsElements)
              ) {
                return [...acc, ...item.directionItemsElements];
              }
              return acc;
            }, []);
          };

          // Collect all points from all direction types
          allPoints = [
            ...extractElementsFromItems(visionItems),
            ...extractElementsFromItems(messageItems),
            ...extractElementsFromItems(valueItems),
          ];
        }
        // Handle legacy structure
        else if (response.data.items) {
          Object.entries(response.data.items).forEach(
            ([type, data]: [string, any]) => {
              // Add main item
              allItems.push({ ...data, type });

              if (data.elements && Array.isArray(data.elements)) {
                allPoints = [...allPoints, ...data.elements];
              }
            }
          );
        }

        // Update points and items signals
        this._points.set(allPoints);
        this._items.set(allItems);

        // Mark data as loaded
        this._isDirectionDataLoaded.set(true);
        this._initialized.set(true);
        this._isDataLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching direction status:', err);
        this._isDataLoading.set(false);
      },
    });
  }

  // Debug method to get current state
  debugState() {
    const points = this._points();
    const items = this._items();
    const userRole = this.currentUserRole();

    // Count items by status for debugging
    const statusCounts = points.reduce((acc: any, point: any) => {
      acc[point.status] = (acc[point.status] || 0) + 1;
      return acc;
    }, {});

    const itemStatusCounts = items.reduce((acc: any, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    // For UnitManager, add specific analysis
    let unitManagerAnalysis = {};
    if (userRole === RolesEnums.UnitManager) {
      const pendingPoints = points.filter((p) => {
        return (
          p.status === ApprovalStatusEnum.Pending || p.status === 'Pending'
        );
      });

      const actedUponPoints = points.filter((p) => {
        return (
          p.status === ApprovalStatusEnum.ApprovedByUnitManager ||
          p.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
          p.status === ApprovalStatusEnum.RejectedByUnitManager
        );
      });

      unitManagerAnalysis = {
        pendingPoints: pendingPoints.length,
        actedUponPoints: actedUponPoints.length,
        pendingItems: pendingPoints.map((p) => ({
          id: p.id,
          status: p.status,
        })),
        actedUponItems: actedUponPoints.map((p) => ({
          id: p.id,
          status: p.status,
        })),
      };
    }

    // For RegionManager, add specific analysis
    let regionManagerAnalysis = {};
    if (userRole === RolesEnums.RegionManager) {
      // Items ready for Region Manager (approved by Unit Manager)
      const itemsReadyForRegionManager = items.filter((i) => {
        return (
          i.status === ApprovalStatusEnum.ApprovedByUnitManager ||
          i.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
        );
      });

      const pointsReadyForRegionManager = points.filter((p) => {
        return (
          p.status === ApprovalStatusEnum.ApprovedByUnitManager ||
          p.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
        );
      });

      // Items already approved by Region Manager
      const hasApprovedItems = items.filter((i) => {
        return (
          i.status === ApprovalStatusEnum.ApprovedByRegionManager ||
          i.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
        );
      });

      const hasApprovedPoints = points.filter((p) => {
        return (
          p.status === ApprovalStatusEnum.ApprovedByRegionManager ||
          p.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
        );
      });

      regionManagerAnalysis = {
        itemsReadyForRegionManager: itemsReadyForRegionManager.length,
        pointsReadyForRegionManager: pointsReadyForRegionManager.length,
        hasApprovedItems: hasApprovedItems.length,
        hasApprovedPoints: hasApprovedPoints.length,
        readyItemsList: itemsReadyForRegionManager.map((i) => ({
          id: i.id,
          status: i.status,
          type: i.type,
        })),
        readyPointsList: pointsReadyForRegionManager.map((p) => ({
          id: p.id,
          status: p.status,
        })),
        approvedItemsList: hasApprovedItems.map((i) => ({
          id: i.id,
          status: i.status,
          type: i.type,
        })),
        approvedPointsList: hasApprovedPoints.map((p) => ({
          id: p.id,
          status: p.status,
        })),
      };
    }

    const currentState = {
      planId: this.planId(),
      stageStatus: this.stageStatus(),
      itemsCount: items.length,
      pointsCount: points.length,
      userRole: userRole,
      isDirectionApproved: this.isDirectionApproved(),
      isDataLoaded: this.isDirectionDataLoaded(),
      allItemsActedUpon: this.allItemsActedUpon(),
      canApprove: this.canApproveBasedOnRole(),
      canShowButton: this.canShowSubmitButton(),
      buttonReason: this.buttonDisabledReason(),
      itemStatusCounts,
      pointStatusCounts: statusCounts,
      items: items.map((i) => ({ id: i.id, status: i.status, type: i.type })),
      points: points.map((p) => ({ id: p.id, status: p.status })),
      unitManagerAnalysis,
      regionManagerAnalysis,
    };

    console.log('[DirectionStatusService] Debug State:', currentState);
    return currentState;
  }

  // Method to force refresh data and return current state
  async forceRefreshAndGetState(): Promise<any> {
    const id = this.planId();
    if (!id) {
      return { error: 'No plan ID set' };
    }

    this._isDataLoading.set(true);

    try {
      await new Promise<void>((resolve) => {
        this.strategicDirectionService.getPlanDirection(id).subscribe({
          next: (response) => {
            if (!response || !response.data) {
              resolve();
              return;
            }

            // Extract the status
            const { status } = response.data;

            // Check if direction is fully approved
            this._isDirectionApproved.set(
              status === ApprovalStatusEnum.ApprovedByHighManagement ||
                status === ApprovalStatusEnum.ApprovedByHighManagementPartially
            );

            this._stageStatus.set(status);

            // Extract all points from all direction items and collect main items
            let allPoints: any[] = [];
            let allItems: any[] = [];

            // Handle the new response structure with getAllDirectionDtoResponse
            if (response.data.getAllDirectionDtoResponse) {
              const visionItems =
                response.data.getAllDirectionDtoResponse.vision || [];
              const messageItems =
                response.data.getAllDirectionDtoResponse.message || [];
              const valueItems =
                response.data.getAllDirectionDtoResponse.value || [];

              // Collect all main items
              allItems = [
                ...visionItems.map((item: any) => ({
                  ...item,
                  type: 'Vision',
                })),
                ...messageItems.map((item: any) => ({
                  ...item,
                  type: 'Message',
                })),
                ...valueItems.map((item: any) => ({ ...item, type: 'Value' })),
              ];

              // Collect all elements from all items
              const extractElementsFromItems = (items: any[]) => {
                return items.reduce((acc, item) => {
                  if (
                    item.directionItemsElements &&
                    Array.isArray(item.directionItemsElements)
                  ) {
                    return [...acc, ...item.directionItemsElements];
                  }
                  return acc;
                }, []);
              };

              // Collect all points from all direction types
              allPoints = [
                ...extractElementsFromItems(visionItems),
                ...extractElementsFromItems(messageItems),
                ...extractElementsFromItems(valueItems),
              ];
            }
            // Handle legacy structure
            else if (response.data.items) {
              Object.entries(response.data.items).forEach(
                ([type, data]: [string, any]) => {
                  // Add main item
                  allItems.push({ ...data, type });

                  if (data.elements && Array.isArray(data.elements)) {
                    allPoints = [...allPoints, ...data.elements];
                  }
                }
              );
            }

            // Update points and items signals
            this._points.set(allPoints);
            this._items.set(allItems);

            // Mark data as loaded
            this._isDirectionDataLoaded.set(true);
            this._initialized.set(true);
            resolve();
          },
          error: () => resolve(),
        });
      });
    } finally {
      this._isDataLoading.set(false);
    }

    // Return current state
    return {
      userRole: this.authService.getUserRole(),
      stageStatus: this._stageStatus(),
      itemsCount: this._points().length,
      canApprove: this.canApproveBasedOnRole(),
      allItemsActedUpon: this.allItemsActedUpon(),
      canShowButton: this.canShowSubmitButton(),
      buttonReason: this.buttonDisabledReason(),
      points: this._points().slice(0, 3), // Include only first 3 points for debugging
    };
  }

  // Method to update a specific item status
  updateItemStatus(itemType: string, newStatus: ApprovalStatusEnum): void {
    const items = this._points();
    const updatedItems = items.map((item) => {
      if (item.type === itemType) {
        return { ...item, status: newStatus };
      }
      return item;
    });

    this._points.set(updatedItems);
  }

  /**
   * Update the status of a specific point by ID
   * This allows real-time updates without API calls when approving/rejecting individual points
   *
   * @param pointId The ID of the DirectionItemsElement to update
   * @param newStatus The new status to set
   */
  updatePointStatus(pointId: string | number, newStatus: string): void {
    // Convert pointId to number if it's a string
    const id = typeof pointId === 'string' ? parseInt(pointId, 10) : pointId;

    const points = this._points();

    // Check if we have the point with this ID
    const pointExists = points.some((point) => point.id === id);
    if (!pointExists) {
      console.warn(`[DirectionStatusService] Point with ID ${id} not found!`);
    }

    // Update the point status
    const updatedPoints = points.map((point) => {
      if (point.id === id) {
        return { ...point, status: newStatus };
      }
      return point;
    });

    // Update the signal with the new point status
    this._points.set(updatedPoints);

    // Notify subscribers that status has changed
    this.refreshSubject.next();
  }

  /**
   * Print detailed debug information about all points
   * This can be called from components to help debug approval issues
   */
  printDetailedPointsInfo(): void {
    const points = this._points();
    const userRole = this.currentUserRole();

    // Count points by status
    const statusCounts: Record<string, number> = {};
    points.forEach((point) => {
      const status = point.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Check if all points have appropriate status based on role
    let statusCheck = '';
    if (userRole === RolesEnums.UnitManager) {
      const allActedUpon = points.every(
        (point) =>
          point.status !== ApprovalStatusEnum.Pending &&
          point.status !== 'Pending'
      );
      statusCheck = allActedUpon
        ? 'No pending points (Good)'
        : 'Some points are still Pending (Need Action)';
    } else if (userRole === RolesEnums.RegionManager) {
      const allApprovedByUnitManager = points.every(
        (point) =>
          point.status === ApprovalStatusEnum.ApprovedByUnitManager ||
          point.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      );
      statusCheck = allApprovedByUnitManager
        ? 'All points are approved by Unit Manager (Good)'
        : 'Some points are not approved by Unit Manager (Problem)';
    } else if (userRole === RolesEnums.HighManagement) {
      const allApprovedByRegionManager = points.every(
        (point) =>
          point.status === ApprovalStatusEnum.ApprovedByRegionManager ||
          point.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      );
      statusCheck = allApprovedByRegionManager
        ? 'All points are approved by Region Manager (Good)'
        : 'Some points are not approved by Region Manager (Problem)';
    }

    console.log('Status check:', statusCheck);

    // Log individual point details
    console.log('Individual point details:');
    points.forEach((point, index) => {
      console.log(
        `[${index}] ID: ${point.id}, Status: ${point.status || 'unknown'}, Value: ${point.value || point.name || 'unknown'}`
      );
    });
  }
}
