import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IGetAccepteableAnalysisPoints } from '../interfaces/IGetAccepteableAnalysisPoints';
import {
  IApprovePlanGoalStageResponse,
  IGetPlanGloalsStatus,
} from '../interfaces/IGetPlanGloalsStatus';
import { IGetGoalById } from '../interfaces/IGetGoalById';
import { IGetAllPlanGoals } from '../interfaces/IGetAllPlanGoals';
import {
  IAddPlanGoalBody,
  IAddPlanGoalResponse,
  IDeletePlanGoalResponse,
} from '../interfaces/IAddPlanGoalBody';

@Injectable({
  providedIn: 'root',
})
export class ObjectiveService {
  private readonly http = inject(HttpClient);

  // getAcceptablePoints
  getAcceptablePoints(planId: string) {
    return this.http.get<IGetAccepteableAnalysisPoints>(
      `/Goals/GetAcceptableAnalysisPoint/${planId}`
    );
  }

  // getPlanGoalsStatus
  getPlanGoalsStatus(planId: string) {
    return this.http.get<IGetPlanGloalsStatus>(
      `/Goals/GetGoalStageStatus/${planId}`
    );
  }

  // approvePlanGoalStage
  approvePlanGoalStage(planId: string) {
    return this.http.post<IApprovePlanGoalStageResponse>(
      `/Goals/ApproveStage/${planId}`,
      null
    );
  }

  // getAllGoals
  getAllGoals(planId: string) {
    return this.http.get<IGetAllPlanGoals>(`/Goals?PlanId=${planId}`);
  }

  // getGoalById
  getGoalById(goalId: string) {
    return this.http.get<IGetGoalById>(`/Goals/${goalId}`);
  }

  // createPlanGoal
  createPlanGoal(planId: string, data: IAddPlanGoalBody) {
    return this.http.post(`/Goals/${planId}`, data);
  }

  // updateGoal
  updateGoal(data: IAddPlanGoalBody) {
    return this.http.post<IAddPlanGoalResponse>(`/Goals`, data);
  }

  // approveGoal
  approveGoal(goalId: string) {
    return this.http.post<IApprovePlanGoalStageResponse>(
      `/Goals/ApproveGoal/${goalId}`,
      null
    );
  }

  // deleteGoal
  deleteGoal(goalId: string) {
    return this.http.delete<IDeletePlanGoalResponse>(`/Goals/${goalId}`);
  }

  approveGoalItem(planId: string, goalItemsId: string): Observable<any> {
    return this.http.post(`/Goals/ApproveGoalItem/${goalItemsId}`, null);
  }

  rejectGoalItem(
    planId: string,
    goalId: string,
    itemId: string,
    Comments: string
  ): Observable<any> {
    return this.http.post(`/Goals/RejectGoalItem/${goalId}/${itemId}`, {
      Comments,
    });
  }

  returnGoalItem(
    planId: string,
    goalId: string,
    itemId: string,
    Comments: string
  ): Observable<any> {
    return this.http.post(`/Goals/ReturnGoalItem/${goalId}/${itemId}`, {
      Comments,
    });
  }

  approveGoalsStep(planId: string): Observable<any> {
    return this.http.post(`/Plans/${planId}/PlanGoals/Approve`, null);
  }

  rejectGoal(planId: string, goalId: string, comment: string): Observable<any> {
    return this.http.post(`/Plans/${planId}/PlanGoals/${goalId}/Reject`, {
      comment,
    });
  }

  returnGoal(planId: string, goalId: string, comment: string): Observable<any> {
    return this.http.post(`/Plans/${planId}/PlanGoals/${goalId}/Return`, {
      comment,
    });
  }
  // getAcceptablePointsList(planId: string, type: string): Observable<any> {
  //   return this.http.get(`/Plans/${planId}/PlanGoals/GetAcceptablePoints`, {
  //     params: { type },
  //   });
  // }
}
