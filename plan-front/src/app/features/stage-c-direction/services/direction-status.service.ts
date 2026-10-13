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

  // True for the per-item "Partially" statuses, which are written when a single
  // item is ticked. The full status only arrives when that role presses send.
  private isPartialStatus(status: string | null | undefined): boolean {
    return (
      status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
      status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
      status === ApprovalStatusEnum.ApprovedByHighManagementPartially
    );
  }

  private roleName(rank: number): string {
    switch (rank) {
      case 1:
        return 'مدير الوحدة';
      case 2:
        return 'مدير المنطقة';
      case 3:
        return 'الإدارة العليا';
      default:
        return '';
    }
  }

  // Why the send button is not on screen.
  //
  // This replaces a three-hundred-line computed whose branches did not cover
  // every state, so in some of them it returned nothing at all and the screen
  // showed a blank space where the button should have been, with no clue what
  // to do next. The rule now mirrors canShowSubmitButton exactly, so the two
  // can never disagree: whatever stops the button produces the sentence that
  // explains it.
  readonly buttonDisabledReason: Signal<string> = computed(() => {
    const userRole = this.currentUserRole();
    const points = this._points();
    const items = this._items();
    const stageStatus = this._stageStatus();
    const all = [...items, ...points];

    if (!this._isDirectionDataLoaded()) return 'جارٍ تحميل البيانات…';

    if (stageStatus === ApprovalStatusEnum.ApprovedByHighManagement) {
      return 'تم اعتماد التوجه الاستراتيجي نهائياً، ويمكنك الانتقال إلى الأهداف';
    }

    const myRank = this.roleRank(userRole);
    if (myRank === 0) {
      return 'بعد الانتهاء من إضافة عناصر التوجه الاستراتيجي، سيقوم مدير الوحدة بمراجعتها';
    }

    if (all.length === 0) return 'لا توجد عناصر للتوجه الاستراتيجي بعد';

    const sentBack = all.filter(
      (x) =>
        RejectionStatuses.includes(x.status) || ReturnedStatuses.includes(x.status)
    );
    if (sentBack.length > 0) {
      return `يوجد ${sentBack.length} عنصر تمت إعادته أو رفضه ويجب تعديله من قبل الوحدة قبل متابعة المرحلة`;
    }

    // Items that have not reached my level yet. Those whose holder is me are
    // mine to review; the rest are still with someone further down.
    const behind = all.filter((x) => this.approvalRank(x.status) < myRank);
    if (behind.length > 0) {
      const mine = behind.filter((x) => this.holderRank(x.status) === myRank);
      if (mine.length > 0) {
        return `يوجد ${mine.length} عنصر بانتظار مراجعتك، يرجى اتخاذ إجراء على جميع العناصر قبل الإرسال`;
      }
      const holder = Math.min(...behind.map((x) => this.holderRank(x.status)));
      return `بانتظار مراجعة وإرسال ${this.roleName(holder)}`;
    }

    if (this.hasSomethingToSend(stageStatus, all, myRank)) return '';

    // Already sent, and nothing new has been ticked since.
    const next = this.roleName(
      Math.min(...all.map((x) => this.holderRank(x.status)))
    );
    return next ? `تم إرسال المرحلة، وهي الآن بانتظار ${next}` : 'تم إرسال المرحلة';
  });

  // Whose move an item is waiting on: the role that ticked it but has not
  // pressed send yet, or otherwise the next role up. Pending is the unit
  // manager's; ApprovedByUnitManagerPartially is still the unit manager's too,
  // until they send.
  private holderRank(status: string | null | undefined): number {
    const rank = this.approvalRank(status);
    return this.isPartialStatus(status) ? rank : rank + 1;
  }

  // Whether pressing send would hand anything on: either the stage has not
  // reached this role yet, or this role has ticked items it has not sent. The
  // second half is what lets a reworked element through when the stage status
  // is still ahead of it. Mirrors Utils.HasSomethingToSend on the server.
  private hasSomethingToSend(
    stageStatus: string | null,
    all: any[],
    myRank: number
  ): boolean {
    return (
      this.approvalRank(stageStatus) < myRank ||
      all.some(
        (x) =>
          this.isPartialStatus(x.status) && this.approvalRank(x.status) === myRank
      )
    );
  }

  // How far up the ladder a status has been approved: 1 unit manager,
  // 2 region manager, 3 high management, 0 for anything not yet approved. The
  // full and the "Partially" form of a level count the same. Mirrors
  // Utils.ApprovalRank on the server.
  private approvalRank(status: string | null | undefined): number {
    switch (status) {
      case ApprovalStatusEnum.ApprovedByUnitManager:
      case ApprovalStatusEnum.ApprovedByUnitManagerPartially:
        return 1;
      case ApprovalStatusEnum.ApprovedByRegionManager:
      case ApprovalStatusEnum.ApprovedByRegionManagerPartially:
        return 2;
      case ApprovalStatusEnum.ApprovedByHighManagement:
      case ApprovalStatusEnum.ApprovedByHighManagementPartially:
        return 3;
      default:
        return 0;
    }
  }

  private roleRank(role: RolesEnums | null): number {
    switch (role) {
      case RolesEnums.UnitManager:
        return 1;
      case RolesEnums.RegionManager:
        return 2;
      case RolesEnums.HighManagement:
        return 3;
      default:
        return 0;
    }
  }

  // Whether this role can send the stage on.
  //
  // This used to be three near-identical branches, each demanding that every
  // item and element read *exactly* its own role's status. Anything approved a
  // level higher failed that equality, so a region manager looking at a stage
  // where two elements had already been ticked by high management saw no button
  // at all, with nothing on screen to say why. Comparing levels by rank instead
  // means "approved at my level or above" counts as done, which is what the
  // server now does too.
  readonly canShowSubmitButton: Signal<boolean> = computed(() => {
    const userRole = this.currentUserRole();
    const points = this._points();
    const items = this._items();
    const stageStatus = this._stageStatus();

    if (!this._isDirectionDataLoaded()) return false;

    // Only the three reviewing roles ever send a stage on.
    const myRank = this.roleRank(userRole);
    if (myRank === 0) return false;

    if (items.length === 0 && points.length === 0) return false;

    // Finished; there is nothing left to send.
    if (stageStatus === ApprovalStatusEnum.ApprovedByHighManagement) return false;

    // Anything sent back has to be reworked before the stage moves.
    const blocked = [...items, ...points].some(
      (x) =>
        RejectionStatuses.includes(x.status) || ReturnedStatuses.includes(x.status)
    );
    if (blocked) return false;

    // Every item and element has to have reached this role's level. Approved
    // higher counts as reached.
    const all = [...items, ...points];
    if (!all.every((x) => this.approvalRank(x.status) >= myRank)) return false;

    // And there has to be something to send. This replaces "the stage status is
    // past me, so hide the button", which went wrong when one element was
    // refused higher up and reworked: the stage status stayed high, the element
    // came back through the unit manager, and neither they nor the region
    // manager could ever send it again.
    return this.hasSomethingToSend(stageStatus, all, myRank);
  });

  // Public accessors as computed signals
  //
  // Only the full status counts as approved. It used to accept the "Partially"
  // one as well, which meant the stage looked closed and the "الي الاهداف" link
  // appeared while high management had merely ticked an item — before the stage
  // was approved and before the plan had actually advanced to الأهداف.
  readonly isDirectionApproved = computed(
    () => this._stageStatus() === ApprovalStatusEnum.ApprovedByHighManagement
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

        // Fully approved means the full status only; the "Partially" one is a
        // single item being ticked, not the stage being closed.
        this._isDirectionApproved.set(
          status === ApprovalStatusEnum.ApprovedByHighManagement
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
