import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IIsFinalAnalysisApprovedBy } from '../../stage-b-analysis/interfaces/iis-final-analysis-approved-by';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SideBarService {
  constructor(private _HttpClient: HttpClient) {}

  IsFinalAnalysisApprovalUrl = `${environment.BACKEND_URL}/StrategicPlan/IsFinalAnalysisApproval`;
  IsFinalAnalysisApprovalGeneralManqgerUrl = `${environment.BACKEND_URL}/StrategicPlan/IsFinalAnalysisApprovalGeneralManqger`;
  IsFinalAnalysisApprovalTheLeaderUrl = `${environment.BACKEND_URL}/StrategicPlan/IsFinalAnalysisApprovalTheLeader`;

  IsFinal() {
    // return this._HttpClient.post<IIsFinalAnalysisApprovedBy>(
    //   `${this.IsFinalAnalysisApprovalUrl}/${unitId}`,
    //   null
    // );
  }
  IsFinalGeneralManqger(
    unitId: number
  ): Observable<IIsFinalAnalysisApprovedBy> {
    return this._HttpClient.post<IIsFinalAnalysisApprovedBy>(
      `${this.IsFinalAnalysisApprovalGeneralManqgerUrl}/${unitId}`,
      null
    );
  }

  IsFinalTheLeader(unitId: number): Observable<IIsFinalAnalysisApprovedBy> {
    return this._HttpClient.post<IIsFinalAnalysisApprovedBy>(
      `${this.IsFinalAnalysisApprovalTheLeaderUrl}/${unitId}`,
      null
    );
  }
}
