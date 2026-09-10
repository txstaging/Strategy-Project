import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { AwarenessService } from '../../services/awareness.service';
import { IGetAllAwareness } from '../../interfaces/IGetAllAwareness';
import { HttpErrorResponse } from '@angular/common/http';
import { PageTitleService } from '../../../page-titles/services/page-title.service';

@Component({
  selector: 'app-awareness-home',
  standalone: true,
  imports: [CommonModule, RouterModule, PagesHeaderComponent, DatePipe],
  templateUrl: './awareness-home.component.html',
  styleUrl: './awareness-home.component.css',
})
export class AwarenessHomeComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  private awarenessService = inject(AwarenessService);
  private pageTitleService = inject(PageTitleService);
  titlesMap = signal<Record<string, string>>({});

  // Admin access control
  isAdmin = signal(false);
  isHighManagement = signal(false);

  // Loading and error states
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Awareness arrays
  allAwareness = signal<IGetAllAwareness[]>([]);
  featuredAwareness = signal<IGetAllAwareness[]>([]);
  regularAwareness = signal<IGetAllAwareness[]>([]);

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(6); // Number of items per page for regular awareness
  totalPages = signal(1);
  pages = signal<number[]>([1]);

  // Flag to show if we have enough items to display pagination
  shouldShowPagination = signal(false);

  ngOnInit(): void {
    // Check user role for editing permissions
    this.checkUserRole();

    // Load awareness
    this.loadAwareness();
    this.pageTitleService.getAllTitles().subscribe({
      next: (res) => {
        const map: Record<string, string> = {};
        res.titles.forEach(t => map[t.key] = t.currentValue);
        this.titlesMap.set(map);
      },
    });
  }

  checkUserRole(): void {
    if (this.authService.currentUser) {
      this.authService.currentUser.subscribe((user) => {
        if (user) {
          // Only high management can edit awareness
          this.isHighManagement.set(user.role === RolesEnums.HighManagement);
          this.isAdmin.set(this.isHighManagement());
        }
      });
    }
  }

  loadAwareness(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.awarenessService.getAllAwareness().subscribe({
      next: (response) => {
        // Sort awareness by date (newest first)
        const items = response.data.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        this.allAwareness.set(items);

        // Get active items only
        const activeItems = items.filter(item => item.status);

        if (activeItems.length > 0) {
          // First two active items are featured
          this.featuredAwareness.set(activeItems.slice(0, 2));

          // Remaining active items are regular
          this.regularAwareness.set(activeItems.slice(2));
        } else {
          this.featuredAwareness.set([]);
          this.regularAwareness.set([]);
        }

        // Only show pagination if we have more than 5 active items in total
        this.shouldShowPagination.set(activeItems.length > 5);

        // Calculate pagination
        this.calculatePagination();

        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(`Failed to load awareness: ${err.message}`);
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  calculatePagination(): void {
    const totalItems = this.regularAwareness().length;
    const pages = Math.ceil(totalItems / this.itemsPerPage());
    this.totalPages.set(pages > 0 ? pages : 1);
    this.pages.set(Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  get paginatedOtherAwareness(): IGetAllAwareness[] {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    return this.regularAwareness().slice(startIndex, startIndex + this.itemsPerPage());
  }

  t(key: string, fallback: string): string {
    return this.titlesMap()[key] || fallback;
  }
}
