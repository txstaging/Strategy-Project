import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationItem, NotificationResponse } from './notification-item';

@Injectable({
  providedIn: 'root'
})
export class NotifcationService {

  constructor(private http: HttpClient) { }

  getNotifications(): Observable<NotificationResponse> {
    return this.http.get<any>('/Notification').pipe(
      map(res => this.mapResponse(res))
    );
  }

  markAsRead(id: number): Observable<any> {
    return this.http.post(`/Notification/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.post('/Notification/mark-all-read', {});
  }

  private mapResponse(res: any): NotificationResponse {
    const notifications = (res.notifications || res.Notifications || []).map(
      (n: any): NotificationItem => ({
        id: n.id ?? n.Id ?? 0,
        message: n.message ?? n.Message ?? '',
        isRead: n.isRead ?? n.IsRead ?? false,
        formNameToReturnToFront: n.formNameToReturnToFront ?? n.FormNameToReturnToFront ?? '',
        planId: n.planId ?? n.PlanId ?? 0,
        createdAt: n.createdAt ?? n.CreatedAt ?? undefined,
      })
    );
    return {
      count: res.count ?? res.Count ?? 0,
      notifications,
    };
  }
}