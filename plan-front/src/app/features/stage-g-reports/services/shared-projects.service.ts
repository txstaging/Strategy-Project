import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IParticipant, ISaveParticipant, ISharedProject } from '../interfaces/ISharedProjects';

// Errors are not caught here; the global interceptor toasts the server message.
@Injectable({ providedIn: 'root' })
export class SharedProjectsService {
  private http = inject(HttpClient);

  list(filter: { unitId?: number; planId?: number; search?: string; onlyShared: boolean }): Observable<ISharedProject[]> {
    let params = new HttpParams().set('onlyShared', filter.onlyShared);
    if (filter.unitId) params = params.set('unitId', filter.unitId);
    if (filter.planId) params = params.set('planId', filter.planId);
    if (filter.search) params = params.set('search', filter.search);
    return this.http.get<ISharedProject[]>('/SharedProjects', { params });
  }

  add(body: ISaveParticipant): Observable<IParticipant> {
    return this.http.post<IParticipant>('/SharedProjects', body);
  }

  update(id: number, body: ISaveParticipant): Observable<IParticipant> {
    return this.http.put<IParticipant>(`/SharedProjects/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`/SharedProjects/${id}`);
  }
}
