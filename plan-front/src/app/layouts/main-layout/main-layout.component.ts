import { Component } from '@angular/core';
import { NavbarComponent } from '../../Core/components/navbar/navbar.component';
import { FooterComponent } from '../../Core/components/footer/footer.component';
import { RouterOutlet } from '@angular/router';
import { PermissionDeniedPopupComponent } from '../../shared/components/permission-denied-popup/permission-denied-popup.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, RouterOutlet, PermissionDeniedPopupComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {}
