import { Component, input } from '@angular/core';

@Component({
  selector: 'app-pages-header',
  standalone: true,
  imports: [],
  templateUrl: './pages-header.component.html',
  styleUrl: './pages-header.component.css',
})
export class PagesHeaderComponent {
  headerTitle = input.required<string>();
  pageDescriptionFirst = input<string>();
  pageDescriptionSecond = input<string>();
}
