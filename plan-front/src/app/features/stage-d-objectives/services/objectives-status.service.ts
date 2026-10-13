import { computed, inject, Injectable, signal } from '@angular/core';
import {
  ApprovalStatusEnum,
  RolesEnums,
  RejectionStatuses,
  ReturnedStatuses,
} from '../../../Core/utilities/consts';
import { AuthService } from '../../auth/services/auth.service';
import { ObjectiveService } from './objective.service';

@Injectable({
  providedIn: 'root',
})
export class ObjectivesStatusService {
  private authService = inject(AuthService);
  private objectiveService = inject(ObjectiveService);

  // Stage status signals
  private stageStatus = signal<ApprovalStatusEnum>(ApprovalStatusEnum.Pending);
  private objectivesList = signal<any[]>([]);
  private dataLoaded = signal(false);

  // How far up the ladder a status has been approved: 1 unit manager,
  // 2 region manager, 3 high management, 0 for anything not yet approved.
  // Mirrors Utils.ApprovalRank on the backend.
  approvalRank(status: string | null | undefined): number {
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

  roleRank(role: string | null | undefined): number {
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

  private myRank(): number {
    return this.roleRank(this.authService.getUserRole());
  }

  private isSentBack(status: string | null | undefined): boolean {
    return (
      RejectionStatuses.includes(status as ApprovalStatusEnum) ||
      ReturnedStatuses.includes(status as ApprovalStatusEnum)
    );
  }

  private isPartialOf(status: string | null | undefined, rank: number): boolean {
    switch (rank) {
      case 1:
        return status === ApprovalStatusEnum.ApprovedByUnitManagerPartially;
      case 2:
        return status === ApprovalStatusEnum.ApprovedByRegionManagerPartially;
      case 3:
        return status === ApprovalStatusEnum.ApprovedByHighManagementPartially;
      default:
        return false;
    }
  }

  // Goals the employee has actually submitted. Drafts are not part of the round.
  private submittedObjectives(): any[] {
    return (this.objectivesList() || []).filter(
      (o) => o && o.status !== ApprovalStatusEnum.SavedAsDraft
    );
  }

  // The goal's own status followed by its three items.
  private statusesOf(objective: any): (string | undefined)[] {
    return [
      objective?.status,
      objective?.name?.status,
      objective?.descripition?.status,
      objective?.indicator?.status,
    ];
  }

  // Whether the stage is currently waiting on the current role: the level
  // below has pressed send, and this role has not sent it on yet.
  isStageWithMe(): boolean {
    const rank = this.myRank();
    return rank > 0 && this.approvalRank(this.stageStatus()) === rank - 1;
  }

  // Whether the current role may approve, reject or return a goal or one of
  // its items at the given status. Must match Utils.CanRoleActInStage.
  //
  // A goal whose item was returned and reworked goes back to the unit manager,
  // but its other items keep the approvals they already earned higher up.
  // Asking every item for the acting role's own status — as this used to — left
  // those goals «غير مكتمل» for the unit manager for good, so the send button
  // never came and nobody above could give the final approval.
  canActOn(status: string | null | undefined): boolean {
    if (!status || status === ApprovalStatusEnum.SavedAsDraft) return false;
    // The details modal briefly writes placeholders such as 'Approved' right
    // after a click, until the fresh data arrives; those are never actionable.
    if (!Object.values(ApprovalStatusEnum).includes(status as ApprovalStatusEnum)) return false;
    if (this.isSentBack(status)) return false;
    if (this.approvalRank(status) >= this.myRank()) return false;
    return this.isStageWithMe();
  }

  // Whether all three items of a goal are approved at the current role's level
  // or above, which is what approving the goal itself requires.
  areGoalItemsApprovedByMe(objective: any): boolean {
    const rank = this.myRank();
    if (rank === 0 || !objective) return false;
    return [
      objective.name?.status,
      objective.descripition?.status,
      objective.indicator?.status,
    ].every((s) => this.approvalRank(s) >= rank);
  }

  // The send rule, shared with GoalsController.ApproveStage: nothing sent back,
  // every submitted goal and item approved at this level or above, and
  // something to hand on — either the stage has not reached this level yet, or
  // this role has ticked goals that are still waiting to be sent.
  private canSend = computed(() => {
    const rank = this.myRank();
    if (rank === 0) return false;

    const statuses = this.submittedObjectives()
      .flatMap((o) => this.statusesOf(o))
      .filter((s) => !!s && s !== ApprovalStatusEnum.SavedAsDraft);
    if (statuses.length === 0) return false;

    if (statuses.some((s) => this.isSentBack(s))) return false;
    if (statuses.some((s) => this.approvalRank(s) < rank)) return false;

    return (
      this.approvalRank(this.stageStatus()) < rank ||
      statuses.some((s) => this.isPartialOf(s, rank))
    );
  });

  // First send at this level.
  canShowSubmitButton = computed(() => {
    return (
      this.canSend() &&
      this.approvalRank(this.stageStatus()) < this.myRank()
    );
  });

  // The stage already went past this level but this role still has approved
  // goals waiting to be sent on.
  canShowResubmitButton = computed(() => {
    return (
      this.canSend() &&
      this.approvalRank(this.stageStatus()) >= this.myRank()
    );
  });

  // Public methods to update state
  setStageStatus(status: ApprovalStatusEnum) {
    this.stageStatus.set(status);
  }

  setObjectivesList(objectives: any[]) {
    this.objectivesList.set(objectives);
  }

  setDataLoaded(loaded: boolean) {
    this.dataLoaded.set(loaded);
  }

  isObjectivesDataLoaded(): boolean {
    return this.dataLoaded();
  }

  isObjectivesApproved(): boolean {
    return this.stageStatus() === ApprovalStatusEnum.ApprovedByHighManagement;
  }

  getStageStatus(): ApprovalStatusEnum {
    return this.stageStatus();
  }

  getObjectivesList(): any[] {
    return this.objectivesList();
  }

  // Why the send button is not on screen. Follows canSend step by step so the
  // two can never disagree.
  getButtonDisabledReason(): string | null {
    const objectives = this.submittedObjectives();

    if (this.stageStatus() === ApprovalStatusEnum.ApprovedByHighManagement) {
      return 'تم اعتماد مرحلة الأهداف بالكامل';
    }

    if (!objectives || objectives.length === 0) {
      return 'لا توجد أهداف للموافقة عليها';
    }

    const rank = this.myRank();
    if (rank === 0) {
      return this.getStageWaitingMessage();
    }

    if (objectives.some((o) => this.statusesOf(o).some((s) => this.isSentBack(s)))) {
      return 'يوجد أهداف مُرجعة، يجب معالجتها قبل إرسال المرحلة';
    }

    const behind: string[] = [];
    this.objectivesList().forEach((objective, index) => {
      if (!objective || objective.status === ApprovalStatusEnum.SavedAsDraft) return;
      const isBehind = this.statusesOf(objective).some(
        (s) => !!s && s !== ApprovalStatusEnum.SavedAsDraft && this.approvalRank(s) < rank
      );
      if (isBehind) behind.push(`الهدف ${index + 1}`);
    });

    if (behind.length > 0) {
      if (this.isStageWithMe()) {
        return `يجب اتخاذ إجراء على الأهداف التالية: ${behind.join('، ')}`;
      }
      return this.getStageWaitingMessage();
    }

    if (this.canSend()) {
      return null;
    }

    return this.getStageWaitingMessage();
  }

  private getStageWaitingMessage(): string {
    const userRole = this.authService.getUserRole();
    const status = this.stageStatus();

    if (status === ApprovalStatusEnum.ApprovedByHighManagement) {
      return 'تم اعتماد مرحلة الأهداف بالكامل';
    }

    if (userRole === RolesEnums.UnitEmployee) {
      if (status === ApprovalStatusEnum.Pending) {
        return 'في انتظار موافقة مدير الوحدة';
      }
      if (
        status === ApprovalStatusEnum.ApprovedByUnitManager ||
        status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      ) {
        return 'في انتظار موافقة مدير المنطقة';
      }
      if (
        status === ApprovalStatusEnum.ApprovedByRegionManager ||
        status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      ) {
        return 'في انتظار موافقة الإدارة العليا';
      }
    }

    if (userRole === RolesEnums.UnitManager) {
      if (
        status === ApprovalStatusEnum.ApprovedByUnitManager ||
        status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      ) {
        return 'في انتظار موافقة مدير المنطقة';
      }
      if (
        status === ApprovalStatusEnum.ApprovedByRegionManager ||
        status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      ) {
        return 'في انتظار موافقة الإدارة العليا';
      }
    }

    if (userRole === RolesEnums.RegionManager) {
      if (status === ApprovalStatusEnum.Pending) {
        return 'في انتظار موافقة مدير الوحدة';
      }
      if (
        status === ApprovalStatusEnum.ApprovedByRegionManager ||
        status === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      ) {
        return 'في انتظار موافقة الإدارة العليا';
      }
    }

    if (userRole === RolesEnums.HighManagement) {
      if (status === ApprovalStatusEnum.Pending) {
        return 'في انتظار موافقة مدير الوحدة';
      }
      if (
        status === ApprovalStatusEnum.ApprovedByUnitManager ||
        status === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      ) {
        return 'في انتظار موافقة مدير المنطقة';
      }
    }

    return 'في انتظار الموافقة';
  }
}
