import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagesHeaderComponent } from '../../../shared/components/pages-header/pages-header.component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, PagesHeaderComponent],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.css',
})
export class PrivacyComponent {}
