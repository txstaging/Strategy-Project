import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import {
  ApprovalStatusEnum,
  RolesEnums,
  RolesStepEnums,
} from '../../../Core/utilities/consts';
import { SharedDataService } from '../../../Core/Service/shared-data.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private _router: Router,
    private sharedDataService: SharedDataService
  ) {
    // Initialize user role from localStorage on service creation
    this.initializeUserRole();
  }

  // Convert userRole to a signal to make it reactive
  private _userRole = signal<RolesEnums | null>(null);
  // Expose the signal as a readonly signal for components to use
  readonly userRole = this._userRole.asReadonly();

  currentUser = new BehaviorSubject<null | any>(null);
  isLoggedInSubject = new BehaviorSubject<boolean>(false);

  // Initialize user role from localStorage or API
  initializeUserRole(): void {
    const token = this.getToken();
    if (token) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const userData = JSON.parse(userInfo);
          if (userData.role) {
            this._userRole.set(userData.role);
            this.currentUser.next(userData);
          } else {
            // If role not in localStorage, fetch from API
            this.getUserInfo().subscribe((res: any) => {
              const userData = res.data;
              this._userRole.set(userData.role);
              this.currentUser.next(userData);
            });
          }
        } catch (e) {
          console.error('Error parsing user info from localStorage', e);
        }
      } else {
        // If no userInfo in localStorage, fetch from API
        this.getUserInfo().subscribe((res: any) => {
          const userData = res.data;
          this._userRole.set(userData.role);
          this.currentUser.next(userData);
        });
      }
    }
  }

  login(obj: object): Observable<any> {
    return this.http.post('/Account/Login', obj).pipe(
      map((res: any) => {
        localStorage.setItem('token', res.data.token);
        this.isLoggedInSubject.next(true);
        this.sharedDataService.setPermissions(res.data.permissions);
        this.getUserInfo().subscribe((res: any) => {
          const userData = res.data;
          // Save user info to localStorage
          localStorage.setItem('userInfo', JSON.stringify(userData));
          this.currentUser.next(userData);
          this._userRole.set(userData.role);
          this._router.navigate(['/home']);
        });
      })
    );
  }

  getUserInfo() {
    return this.http.get('/Account/me').pipe(
      tap((res: any) => {
        if (res?.data) {
          // Save user info to localStorage
          localStorage.setItem('userInfo', JSON.stringify(res.data));
          if (res.data.role) {
            this._userRole.set(res.data.role);
          }
        }
      })
    );
  }

  logoutUser() {
    localStorage.clear();
    this._router.navigate(['/login']);
    this.isLoggedInSubject.next(false);
    this._userRole.set(null);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isRole(role: RolesEnums): boolean {
    return this._userRole() === role;
  }

  isRoleNot(role: RolesEnums): boolean {
    return this._userRole() !== role;
  }

  getUserRole(): RolesEnums | null {
    // Always check localStorage first for the most up-to-date role
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const userData = JSON.parse(userInfo);
        if (userData.role) {
          // Update our signal if it doesn't match
          if (this._userRole() !== userData.role) {
            this._userRole.set(userData.role);
          }
          return userData.role;
        }
      }
    } catch (e) {
      console.error(
        '[AuthService] Error retrieving user role from localStorage',
        e
      );
    }

    // Fall back to the signal value if localStorage check fails
    return this._userRole();
  }

  /**
   * Force refresh the user role from localStorage
   * This is useful when there might be role synchronization issues
   */
  refreshUserRole(): RolesEnums | null {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const userData = JSON.parse(userInfo);
        if (userData.role) {
          this._userRole.set(userData.role);
          return userData.role;
        }
      }
    } catch (e) {
      console.error(
        '[AuthService] Error refreshing user role from localStorage',
        e
      );
    }
    return this._userRole();
  }

  allowInRoles(roles: RolesEnums[]): boolean {
    return this._userRole() ? roles.includes(this._userRole()!) : false;
  }

  isAllowToSendToHigherRole(status: ApprovalStatusEnum): boolean {
    // Extract role name from status by removing "ApprovedBy", "RejectedBy", or "ReturnedBy"
    const statusRole = status?.replace(
      /(ApprovedBy|RejectedBy|ReturnedBy)/,
      ''
    );

    // Get the step numbers for both roles
    const statusStepNumber =
      RolesStepEnums[statusRole as keyof typeof RolesStepEnums] || 0;
    const currentStepNumber =
      RolesStepEnums[this._userRole() as keyof typeof RolesStepEnums];

    return currentStepNumber > statusStepNumber;
  }

  getStatusAction(status: string): string {
    if (status.includes('Approved')) {
      return 'Approved';
    }
    if (status.includes('Rejected')) {
      return 'Rejected';
    }
    if (status.includes('Returned')) {
      return 'Returned';
    }
    return 'Pending';
  }

  getStatusBasedOnRole(status: ApprovalStatusEnum): string {
    return !this.isAllowToSendToHigherRole(status)
      ? this.getStatusAction(status)
      : 'Pending';
  }
}
