import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SharedDataService } from './Core/Service/shared-data.service';
import { AuthService } from './features/auth/services/auth.service';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { CommonModule } from '@angular/common';
import { SignalrService } from './services/signalr.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private sharedDataService: SharedDataService,
    private signalRService: SignalrService
  ) {
    if (!this.sharedDataService.loadPermissionsFromLocalStorage()) {
      this.authService.logoutUser();
    }
    console.log('AppComponent Loaded');
  }

  ngOnInit() {
    const currentUserSubject = this.authService.currentUser;

    if (!currentUserSubject.value && this.authService.getToken()) {
      this.authService.getUserInfo().subscribe((res: any) => {
        const userData = res.data;
        this.authService.currentUser.next(userData);
        this.signalRService.startConnection();
        console.log('SignalR Connected');
      });
    }
    this.signalRService.startConnection();
  }
}
