import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navigation-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigation-card.component.html',
  styleUrl: './navigation-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() routerLink = '';

  constructor(private router: Router) {}

  navigate() {
    if (this.routerLink) {
      this.router.navigate([this.routerLink]);
    }
  }
}
