import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IGetPlanStatus } from '../interfaces/IGetPlanStatus';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlanStatusService {

private _HttpClient = inject(HttpClient);

getPlanStatus(planId: string): Observable<IGetPlanStatus> {
  return this._HttpClient.get<IGetPlanStatus>(`/PlanStatus/${planId}`);
}

}
