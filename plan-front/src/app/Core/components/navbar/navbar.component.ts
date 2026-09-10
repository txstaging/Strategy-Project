import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { RolesEnums } from '../../utilities/consts';
import { SignalrService } from '../../../services/signalr.service';
import { NotifcationService } from '../../../notifcation.service';
import { NotificationItem, NotificationResponse } from '../../../notification-item';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() userInfo!: Record<string, any>;
  showProfilePopupSection = signal(false);
  showLoginButton = false;
  isHighManagement = false;

  constructor(
    public router: Router,
    private authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef,
    private signalR: SignalrService,
    private notificationService: NotifcationService
  ) {}
  notifications: any[] = [];
  notificationsMessages: NotificationResponse = { count: 0, notifications: [] };
  count = 0;
  isOpen = false;
  activeFilter: 'all' | 'read' | 'unread' = 'all';

  get filteredNotifications(): NotificationItem[] {
    const list = this.notificationsMessages.notifications;
    if (this.activeFilter === 'unread') return list.filter(n => !n.isRead);
    if (this.activeFilter === 'read') return list.filter(n => n.isRead);
    return list;
  }

  get unreadCount(): number {
    return this.notificationsMessages.notifications.filter(n => !n.isRead).length;
  }
  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe(next => {
      this.notificationsMessages = next;
      this.count = next.count;
      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnInit(): void {
    if (this.authService.currentUser) {
      this.authService.currentUser.subscribe((user) => {
        this.userInfo = user;
        this.isHighManagement = RolesEnums.HighManagement === user?.role;
        this.changeDetectorRef.detectChanges();
        this.loadNotifications();
      });
    } else {
      this.showLoginButton = true;
      this.loadNotifications();
    }

    // Subscribe to real-time SignalR updates
    this.signalR.newNotification$.subscribe(() => {
      this.loadNotifications();
    });

    document.addEventListener(
      'click',
      this.closeModalOnClickOutside.bind(this)
    );
  }

  ngOnDestroy(): void {
    document.removeEventListener(
      'click',
      this.closeModalOnClickOutside.bind(this)
    );
  }
  togglePopup() {
    if (this.isOpen) {
      this.isOpen = false;
    } else {
      this.notificationService.getNotifications().subscribe(next => {
        this.notificationsMessages = next;
        this.count = next.count;
        this.isOpen = true;
        this.changeDetectorRef.detectChanges();
      });
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe();
    this.signalR.markAllAsRead();
    this.count = 0;
    this.notificationsMessages.notifications.forEach(n => n.isRead = true);
  }

  private routeMap: Record<string, string> = {
    'strategic-plan':    '/plans',
    'plans':             '/plans',
    'analysis-stage':    '/plans/:planId/analysis-stage',
    'Threats':           '/plans/:planId/analysis-stage/Threats',
    'Strength':          '/plans/:planId/analysis-stage/Strength',
    'Risks':             '/plans/:planId/analysis-stage/Risks',
    'Opportunities':     '/plans/:planId/analysis-stage/Opportunities',
    'Priorities':        '/plans/:planId/analysis-stage/Priorities',
    'FinalAnalysis':     '/plans/:planId/analysis-stage/FinalAnalysis',
    'direction-stage':   '/plans/:planId/direction-stage',
    'objectives':        '/plans/:planId/objectives/current-objectives',
    'initiatives':       '/plans/:planId/initiatives',
    'projects':          '/plans/:planId/projects',
    'reports':           '/plans/reports',
  };

  onNotificationClick(notification: NotificationItem) {
    // Mark as read locally
    notification.isRead = true;
    this.count = Math.max(0, this.count - 1);
    this.isOpen = false;

    // Call API to mark as read on the backend
    this.notificationService.markAsRead(notification.id).subscribe();

    // Navigate to the related page
    const template = this.routeMap[notification.formNameToReturnToFront];
    if (template) {
      const path = template.replace(':planId', String(notification.planId));
      this.router.navigateByUrl(path);
    }
  }

  toggleProfilePopupSection(): void {
    this.showProfilePopupSection.update((prev) => !prev);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      this.logout();
    }
  }

  closeModalOnClickOutside(event: MouseEvent): void {
    const target = event.target as Node;

    // Close profile popup on outside click
    const userContainer = document.querySelector('.user-container');
    const profilePopup = document.querySelector('.profile-popup-section');

    if (userContainer && userContainer.contains(target)) {
      return;
    }

    if (
      profilePopup &&
      !profilePopup.contains(target) &&
      this.showProfilePopupSection()
    ) {
      this.showProfilePopupSection.set(false);
    }

    // Close notification popup on outside click
    const bellContainer = document.querySelector('.notification-bell-container');
    const notifPopup = document.querySelector('.notification-popup');

    if (bellContainer && bellContainer.contains(target)) {
      return;
    }

    if (this.isOpen && notifPopup && !notifPopup.contains(target)) {
      this.isOpen = false;
    }
  }
  logout(): void {
    this.authService.logoutUser();
    this.showProfilePopupSection.set(false);
  }

  login(): void {
    this.router.navigate(['/login']);
    this.showProfilePopupSection.set(false);
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
    this.showProfilePopupSection.set(false);
  }
}
