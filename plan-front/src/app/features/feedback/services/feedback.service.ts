import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ICreateFeedbackRequest,
  IFeedbackRequest,
  IPlanOption,
  ISubjectOption,
} from '../interfaces/IFeedback';

// Errors are deliberately not caught here. The global error interceptor turns
// the server's Arabic message into a toast, and swallowing failures is what hid
// the missing project-delete endpoint for so long.
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private http = inject(HttpClient);

  // Plans the user may ask about, by name.
  plans(): Observable<IPlanOption[]> {
    return this.http.get<IPlanOption[]>('/Feedback/plans');
  }

  // Items inside one stage of one plan, by name.
  subjects(planId: number, subject: number): Observable<ISubjectOption[]> {
    return this.http.get<ISubjectOption[]>(`/Feedback/subjects?planId=${planId}&subject=${subject}`);
  }

  create(body: ICreateFeedbackRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>('/Feedback', body);
  }

  // Requests addressed to me.
  inbox(planId?: number): Observable<IFeedbackRequest[]> {
    const query = planId ? `?planId=${planId}` : '';
    return this.http.get<IFeedbackRequest[]>(`/Feedback/inbox${query}`);
  }

  // Requests I sent, with the answers so far.
  sent(planId?: number): Observable<IFeedbackRequest[]> {
    const query = planId ? `?planId=${planId}` : '';
    return this.http.get<IFeedbackRequest[]>(`/Feedback/sent${query}`);
  }

  getOne(id: number): Observable<IFeedbackRequest> {
    return this.http.get<IFeedbackRequest>(`/Feedback/${id}`);
  }

  respond(id: number, message: string): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`/Feedback/${id}/respond`, { message });
  }

  close(id: number): Observable<void> {
    return this.http.post<void>(`/Feedback/${id}/close`, {});
  }
}
