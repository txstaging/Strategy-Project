import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavigationCardComponent } from '../../components/navigation-card/navigation-card.component';

@Component({
  selector: 'app-navigation-card-list-page',
  standalone: true,
  imports: [NavigationCardComponent],
  template: `
    <div class="settings-container">
      <div class="navigation-grid">
        @for (item of navigationItems; track item.routerLink) {
          <app-navigation-card
            [title]="item.title"
            [subtitle]="item.subtitle"
            [routerLink]="item.routerLink"
          />
        }
      </div>
    </div>
  `,
  styleUrl: './navigation-card-list-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationCardListPageComponent {
  navigationItems: NavigationItem[] = [
    {
      title: 'المستخدمين',
      subtitle: 'ادارة حسابات المستخدمين',
      routerLink: '/settings/user-controller',
    },
    {
      title: 'الوحدات',
      subtitle: `ادارة الوحدات`,
      routerLink: '/settings/unit-controller',
    },
    {
      title: 'التحكمات',
      subtitle: 'اضافه التحكمات جديده',
      routerLink: '/settings/controllers',
    },
    {
      title: 'عناوين الصفحات',
      subtitle: 'تعديل العناوين والأسماء المعروضة',
      routerLink: '/settings/title-management',
    },
  ];
}

interface NavigationItem {
  title: string;
  subtitle: string;
  routerLink: string;
}
