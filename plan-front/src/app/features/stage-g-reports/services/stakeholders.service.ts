import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IStakeholders } from '../interfaces/IStakeholders';

@Injectable({ providedIn: 'root' })
export class StakeholdersService {
  private http = inject(HttpClient);

  list(filter: { unitId?: number; planId?: number; search?: string }): Observable<IStakeholders> {
    let params = new HttpParams();
    if (filter.unitId) params = params.set('unitId', filter.unitId);
    if (filter.planId) params = params.set('planId', filter.planId);
    if (filter.search) params = params.set('search', filter.search);
    return this.http.get<IStakeholders>('/Stakeholders', { params });
  }
}
