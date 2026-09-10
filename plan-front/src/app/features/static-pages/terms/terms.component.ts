import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagesHeaderComponent } from '../../../shared/components/pages-header/pages-header.component';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, PagesHeaderComponent],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.css',
})
export class TermsComponent {}
