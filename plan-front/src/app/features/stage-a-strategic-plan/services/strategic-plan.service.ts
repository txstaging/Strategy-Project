import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StrategicPlanService {
  constructor(private _HttpClient: HttpClient) {}

  PlanApprovalHighManager = `${environment.BACKEND_URL}/StrategicPlan/ApprovalOfTheRequest`;

  ApprovePlanRegionManagerUrl = `${environment.BACKEND_URL}/StrategicPlan/ApprovalOfTheRequestByGeneralManager`;
  ApprovePlanHighManagementUrl = `${environment.BACKEND_URL}/StrategicPlan/ApprovalOfTheRequestByTheLeader`;
  RequestRejectedByGeneralManagerUrl = `${environment.BACKEND_URL}/StrategicPlan/RequestRejectedByGeneralManager`;
  RequestRejectedByTheLeaderUrl = `${environment.BACKEND_URL}/StrategicPlan/RequestRejectedByTheLeader`;

  approvePlanRegionManager(planRequestId: number): Observable<any> {
    return this._HttpClient.post(
      `${this.ApprovePlanRegionManagerUrl}/${planRequestId}`,
      null
    );
  }

  approvePlanHighManagement(planRequestId: number): Observable<any> {
    return this._HttpClient.post(
      `${this.ApprovePlanHighManagementUrl}/${planRequestId}`,
      null
    );
  }

  rejectPlanRegionManager(rejectPayload: Record<string, any>): Observable<any> {
    return this._HttpClient.post(`${this.RequestRejectedByGeneralManagerUrl}`, {
      Id: rejectPayload['id'],
      RessonForReject: rejectPayload['Reason'],
    });
  }

  rejectPlanHighManagement(
    rejectPayload: Record<string, any>
  ): Observable<any> {
    return this._HttpClient.post(`${this.RequestRejectedByTheLeaderUrl}`, {
      Id: rejectPayload['id'],
      RessonForReject: rejectPayload['Reason'],
    });
  }

  // ----------------------------------------------------------------
  getStrategicPlanList(params: Record<string, string>): Observable<any> {
    return this._HttpClient.get('/Plans', params);
  }

  getCurrantStrategicPlan(params: Record<string, string>,status = 'Current'): Observable<any> {
    // return this._HttpClient.get('/Plans?Filter=old', { params });
    return this._HttpClient.get(`/Plans?Filter=${status}`, { params });
  }

  createPlan(data: Record<string, any>): Observable<any> {
    return this._HttpClient.post('/Plans', data);
  }

  updatePlan(data: Record<string, any>): Observable<any> {
    return this._HttpClient.post(`/Plans/${data['id']}`, {
      name: data['name'],
    });
  }
  deletePlan(id: string): Observable<any> {
    return this._HttpClient.delete(`/Plans/${id}`);
  }
}
