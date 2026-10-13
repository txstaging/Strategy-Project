import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ICommunicationEntry, ISaveCommunicationEntry } from '../interfaces/ICommunicationPlan';

// Errors are not caught here; the global interceptor toasts the server message.
@Injectable({ providedIn: 'root' })
export class CommunicationPlanService {
  private http = inject(HttpClient);

  list(planId: number): Observable<ICommunicationEntry[]> {
    return this.http.get<ICommunicationEntry[]>(`/CommunicationPlan?planId=${planId}`);
  }

  add(body: ISaveCommunicationEntry): Observable<ICommunicationEntry> {
    return this.http.post<ICommunicationEntry>('/CommunicationPlan', body);
  }

  update(id: number, body: ISaveCommunicationEntry): Observable<ICommunicationEntry> {
    return this.http.put<ICommunicationEntry>(`/CommunicationPlan/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`/CommunicationPlan/${id}`);
  }
}
