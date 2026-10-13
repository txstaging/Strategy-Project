import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IAllocation, IProjectAllocations, ISaveAllocation } from '../interfaces/IProjectAllocation';

// Errors are not caught here; the global interceptor toasts the server message.
@Injectable({ providedIn: 'root' })
export class ProjectAllocationService {
  private http = inject(HttpClient);

  projects(filter: { unitId?: number; planId?: number; search?: string }): Observable<IProjectAllocations[]> {
    let params = new HttpParams();
    if (filter.unitId) params = params.set('unitId', filter.unitId);
    if (filter.planId) params = params.set('planId', filter.planId);
    if (filter.search) params = params.set('search', filter.search);
    return this.http.get<IProjectAllocations[]>('/ProjectAllocation/projects', { params });
  }

  add(body: ISaveAllocation): Observable<IAllocation> {
    return this.http.post<IAllocation>('/ProjectAllocation', body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`/ProjectAllocation/${id}`);
  }
}
