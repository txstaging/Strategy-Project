import { Component, OnInit, signal, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { ReportsService } from '../../services/reports.service';
import { IGetReportsResponse } from '../../interfaces/IGetReportsResponse';
import { PageTitleService } from '../../../page-titles/services/page-title.service';

@Component({
  selector: 'app-reports-home',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './reports-home.component.html',
  styleUrl: './reports-home.component.css',
})
export class ReportsHomeComponent implements OnInit {
  private pageTitleService = inject(PageTitleService);
  titlesMap = signal<Record<string, string>>({});

  constructor(
    public router: Router,
    private reportsService: ReportsService
  ) {}

  reportsData: IGetReportsResponse = [];

  // Using a single signal for all sections
  expandedSections = signal<Record<number, boolean>>({});

  // Helper to toggle a section
  toggleSection(index: number): void {
    this.expandedSections.update((sections) => ({
      ...sections,
      [index]: !sections[index],
    }));
  }

  // Helper to check if section is expanded
  isSectionExpanded(index: number): boolean {
    return this.expandedSections()[index] ?? false;
  }

  t(key: string, fallback: string): string {
    return this.titlesMap()[key] || fallback;
  }

  ngOnInit() {
    this.pageTitleService.getAllTitles().subscribe({
      next: (res) => {
        const map: Record<string, string> = {};
        res.titles.forEach(t => map[t.key] = t.currentValue);
        this.titlesMap.set(map);
      },
    });
    this.reportsService.getReportsData().subscribe({
      next: (response: IGetReportsResponse) => {
        this.reportsData = response;
      },
      error: (error) => {
        console.error('Error fetching reports data:', error);
        this.reportsData = [];
      },
    });
  }
}
