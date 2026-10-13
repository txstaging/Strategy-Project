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

  // Keys are the names the API sends in formNameToReturnToFront, defined by the
  // FormNameToReturnToFront enum on the server. Keep the two in step.
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
    // The id carried here is the feedback request, not a plan, so the recipient
    // lands on the question itself with a reply box.
    'feedback':          '/plans/feedback/:planId',
    // Likewise the id here is the share, not a plan.
    'progress':          '/plans/progress/:planId',
  };

  // Arabic name of the stage a notification belongs to. The raw key is an
  // internal English slug and used to be printed to the user as-is, which put
  // text like "document-amendment-request" in the middle of an Arabic screen.
  private stageLabels: Record<string, string> = {
    'strategic-plan':    'الخطة الاستراتيجية',
    'plans':             'الخطة الاستراتيجية',
    'analysis-stage':    'التحليل',
    'Threats':           'التحليل',
    'Strength':          'التحليل',
    'Risks':             'التحليل',
    'Opportunities':     'التحليل',
    'Priorities':        'التحليل',
    'FinalAnalysis':     'التحليل',
    'direction-stage':   'التوجه الاستراتيجي',
    'objectives':        'الأهداف',
    'initiatives':       'المبادرات',
    'projects':          'المشاريع',
    'reports':           'التقارير',
    'feedback':          'طلب مرئيات',
    'progress':          'نسبة الإنجاز',
  };

  stageLabel(formName: string | undefined): string {
    return formName ? this.stageLabels[formName] ?? '' : '';
  }

  // Arabic "time ago" for a notification, so the list can be read in order.
  relativeTime(createdAt: string | undefined): string {
    if (!createdAt) return '';

    // Timestamps are stored in UTC; treat a value with no zone marker as UTC
    // rather than letting the browser read it as local time.
    const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(createdAt) ? createdAt : `${createdAt}Z`;
    const then = new Date(iso).getTime();
    if (isNaN(then)) return '';

    const minutes = Math.floor((Date.now() - then) / 60000);
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `منذ ${days} يوم`;

    return new Date(iso).toLocaleDateString('ar-SA');
  }

  onNotificationClick(notification: NotificationItem) {
    const template = this.routeMap[notification.formNameToReturnToFront];

    // Only mark it read and close the popup when there is somewhere to go.
    // Doing it unconditionally meant an unrecognised notification was quietly
    // consumed: it lost its unread dot, the popup shut, and nothing happened.
    if (!template) {
      console.warn(
        `[notifications] no route for "${notification.formNameToReturnToFront}"`
      );
      return;
    }

    notification.isRead = true;
    this.count = Math.max(0, this.count - 1);
    this.isOpen = false;

    this.notificationService.markAsRead(notification.id).subscribe();

    this.router.navigateByUrl(
      template.replace(':planId', String(notification.planId))
    );
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
