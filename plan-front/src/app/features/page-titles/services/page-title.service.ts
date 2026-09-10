import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { IGetAllPageTitlesResponse, IPageTitle } from '../interfaces/IPageTitle';

@Injectable({
  providedIn: 'root',
})
export class PageTitleService {
  private readonly http = inject(HttpClient);

  private titlesSubject = new BehaviorSubject<IPageTitle[]>([]);
  titles$ = this.titlesSubject.asObservable();

  getAllTitles(): Observable<IGetAllPageTitlesResponse> {
    return this.http.get<IGetAllPageTitlesResponse>('/PageTitle').pipe(
      tap(res => this.titlesSubject.next(res.titles))
    );
  }

  updateTitle(id: number, currentValue: string): Observable<void> {
    return this.http.post<void>(`/PageTitle/${id}`, { currentValue });
  }

  resetTitle(id: number): Observable<void> {
    return this.http.post<void>(`/PageTitle/${id}/reset`, {});
  }

  resetAllTitles(): Observable<void> {
    return this.http.post<void>('/PageTitle/reset-all', {});
  }

  getTitle(key: string): string {
    const title = this.titlesSubject.value.find(t => t.key === key);
    return title?.currentValue ?? '';
  }
}
