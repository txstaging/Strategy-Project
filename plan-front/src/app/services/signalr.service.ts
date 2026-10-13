import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../features/auth/services/auth.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { NotificationModel } from '../notification-model';
import { environment } from '../../environments/environment';

interface ServerNotificationDto {
  id?: number;
  message?: string;
  isRead?: boolean;
  formNameToReturnToFront?: string;
  planId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SignalrService {

  private hubConnection!: signalR.HubConnection;

  constructor(private toastr: ToastrService,private authService: AuthService) {}

  private notifications = new BehaviorSubject<NotificationModel[]>([]);
  notifications$ = this.notifications.asObservable();

  private newNotification = new Subject<void>();
  newNotification$ = this.newNotification.asObservable();

  private count = new BehaviorSubject<number>(0);
  count$ = this.count.asObservable();



  // The hub lives next to the API, not under /api, so drop that suffix from the
  // configured backend URL. This used to be the literal string
  // "http://localhost:5063/notificationHub", so live notifications only ever
  // worked on a developer machine and were silently dead in every deployment.
  private get hubUrl(): string {
    return `${environment.BACKEND_URL.replace(/\/api\/?$/, '')}/notificationHub`;
  }

  startConnection() {
    // Starting twice leaks the first connection and delivers every notification
    // twice, so reuse a connection that is already up or on its way up.
    if (
      this.hubConnection &&
      this.hubConnection.state !== signalR.HubConnectionState.Disconnected
    ) {
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => localStorage.getItem('token') ?? ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .catch((err) => {
        console.error('[SignalR] connection failed:', err);
      });

    this.hubConnection.on(
      'ReceiveNotification',
      (message: string, dto?: ServerNotificationDto) => {
        const newNotification: NotificationModel = {
          id: dto?.id,
          message,
          createdAt: new Date(),
          isRead: false,
          formNameToReturnToFront: dto?.formNameToReturnToFront,
          planId: dto?.planId,
        };

        const current = this.notifications.value;
        this.notifications.next([newNotification, ...current]);

        this.count.next(this.count.value + 1);
        this.newNotification.next();

        this.toastr.info(message, 'إشعار جديد');
      }
    );
  }

  markAllAsRead() {
    const updated = this.notifications.value.map(n => ({
      ...n,
      isRead: true
    }));

    this.notifications.next(updated);
    this.count.next(0);
  }
}
