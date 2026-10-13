import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ICreateProgressShare,
  IProgressOption,
  IProgressShare,
} from '../interfaces/IProgressShare';

// Errors are not caught here; the global interceptor toasts the server's
// Arabic message.
@Injectable({ providedIn: 'root' })
export class ProgressShareService {
  private http = inject(HttpClient);

  options(): Observable<IProgressOption[]> {
    return this.http.get<IProgressOption[]>('/ProgressShare/options');
  }

  create(body: ICreateProgressShare): Observable<{ id: number }> {
    return this.http.post<{ id: number }>('/ProgressShare', body);
  }

  inbox(): Observable<IProgressShare[]> {
    return this.http.get<IProgressShare[]>('/ProgressShare/inbox');
  }

  sent(): Observable<IProgressShare[]> {
    return this.http.get<IProgressShare[]>('/ProgressShare/sent');
  }

  getOne(id: number): Observable<IProgressShare> {
    return this.http.get<IProgressShare>(`/ProgressShare/${id}`);
  }
}
