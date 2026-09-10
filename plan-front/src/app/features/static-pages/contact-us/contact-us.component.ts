import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PagesHeaderComponent } from '../../../shared/components/pages-header/pages-header.component';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, RouterModule, PagesHeaderComponent],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css',
})
export class ContactUsComponent {
  // Contact information
  contactInfo = {
    address: 'الرياض، المملكة العربية السعودية',
    emails: [
      { type: 'البريد الرئيسي', email: 'management@MOD.com' },
      { type: 'البريد الإضافي', email: 'management2@MOD.com' },
    ],
    phones: [
      { type: 'الأرقام الرئيسية', number: '920011741 - 920011742 - 920011743' },
    ],
    hours: 'الأحد - الخميس: 8:00 صباحًا - 4:00 مساءً',
    socialMedia: [
      { name: 'Twitter', icon: 'bi bi-twitter', url: 'https://twitter.com/' },
      {
        name: 'Facebook',
        icon: 'bi bi-facebook',
        url: 'https://facebook.com/',
      },
      {
        name: 'Instagram',
        icon: 'bi bi-instagram',
        url: 'https://instagram.com/',
      },
      {
        name: 'LinkedIn',
        icon: 'bi bi-linkedin',
        url: 'https://linkedin.com/',
      },
    ],
  };
}
