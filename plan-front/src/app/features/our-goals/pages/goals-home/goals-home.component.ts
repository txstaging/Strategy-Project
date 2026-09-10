import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { GoalService } from '../../services/goal.service';
import { IGetAllGoals } from '../../interfaces/IGetAllGoals';
import { HttpErrorResponse } from '@angular/common/http';
import { PageTitleService } from '../../../page-titles/services/page-title.service';

@Component({
  selector: 'app-goals-home',
  standalone: true,
  imports: [CommonModule, RouterModule, PagesHeaderComponent, DatePipe],
  templateUrl: './goals-home.component.html',
  styleUrl: './goals-home.component.css',
})
export class GoalsHomeComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  private goalService = inject(GoalService);
  private pageTitleService = inject(PageTitleService);
  titlesMap = signal<Record<string, string>>({});

  // Admin access control
  isAdmin = signal(false);
  isHighManagement = signal(false);

  // Loading and error states
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Goals arrays
  allGoals = signal<IGetAllGoals[]>([]);
  featuredGoals = signal<IGetAllGoals[]>([]);
  regularGoals = signal<IGetAllGoals[]>([]);

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(6); // Number of items per page for regular goals
  totalPages = signal(1);
  pages = signal<number[]>([1]);

  // Flag to show if we have enough goals to display pagination
  shouldShowPagination = signal(false);

  ngOnInit(): void {
    // Check user role for editing permissions
    this.checkUserRole();

    // Load goals
    this.loadGoals();
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
          // Only high management can edit goals
          this.isHighManagement.set(user.role === RolesEnums.HighManagement);
          this.isAdmin.set(this.isHighManagement());
        }
      });
    }
  }

  loadGoals(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.goalService.getAllGoals().subscribe({
      next: (response) => {
        // Sort goals by date (newest first)
        const goals = response.data.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        this.allGoals.set(goals);

        // Get active goals only
        const activeGoals = goals.filter(goal => goal.status);

        if (activeGoals.length > 0) {
          // First two active goals are featured
          this.featuredGoals.set(activeGoals.slice(0, 2));

          // Remaining active goals are regular
          this.regularGoals.set(activeGoals.slice(2));
        } else {
          this.featuredGoals.set([]);
          this.regularGoals.set([]);
        }

        // Only show pagination if we have more than 5 active goals in total
        this.shouldShowPagination.set(activeGoals.length > 5);

        // Calculate pagination
        this.calculatePagination();

        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(`Failed to load goals: ${err.message}`);
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  calculatePagination(): void {
    const totalItems = this.regularGoals().length;
    const pages = Math.ceil(totalItems / this.itemsPerPage());
    this.totalPages.set(pages > 0 ? pages : 1);
    this.pages.set(Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  get paginatedOtherGoals(): IGetAllGoals[] {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    return this.regularGoals().slice(startIndex, startIndex + this.itemsPerPage());
  }

  t(key: string, fallback: string): string {
    return this.titlesMap()[key] || fallback;
  }
}
