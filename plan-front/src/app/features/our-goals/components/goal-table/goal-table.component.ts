import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { GoalService } from '../../services/goal.service';
import { IGetAllGoals } from '../../interfaces/IGetAllGoals';
import { HttpErrorResponse } from '@angular/common/http';
import { PageTitleService } from '../../../page-titles/services/page-title.service';

// Extended interface to track UI state for each goal
interface GoalWithUIState extends IGetAllGoals {
  updating?: boolean;
}

enum ConfirmAction {
  DELETE,
  MARK_ALL_INACTIVE
}

@Component({
  selector: 'app-goal-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ConfirmDialogComponent,
    PagesHeaderComponent,
    DatePipe
  ],
  templateUrl: './goal-table.component.html',
  styleUrl: './goal-table.component.css',
})
export class GoalTableComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  private goalService = inject(GoalService);
  private pageTitleService = inject(PageTitleService);
  titlesMap = signal<Record<string, string>>({});

  // Permission signal
  isHighManagement = signal(false);

  // Special operation statuses
  markingAllInactive = signal(false);

  // Table data
  goals: GoalWithUIState[] = [];
  filteredGoals: GoalWithUIState[] = [];

  // Search and filter
  searchTerm = '';
  filterOption = 'all';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Confirmation dialog state
  showConfirmDialog = signal(false);
  confirmMessage = '';
  confirmDangerMode = true;
  private currentAction = ConfirmAction.DELETE;
  goalToDelete: GoalWithUIState | null = null;

  // Loading and error states
  isLoading = false;
  error: string | null = null;

  ngOnInit(): void {
    // Check user permissions
    this.checkUserRole();

    // Load data
    this.loadGoals();
    this.pageTitleService.getAllTitles().subscribe({
      next: (res) => {
        const map: Record<string, string> = {};
        res.titles.forEach(t => map[t.key] = t.currentValue);
        this.titlesMap.set(map);
      },
    });
  }

  t(key: string, fallback: string): string {
    return this.titlesMap()[key] || fallback;
  }

  checkUserRole(): void {
    if (this.authService.currentUser) {
      this.authService.currentUser.subscribe((user) => {
        if (user) {
          // Only high management can edit goals
          this.isHighManagement.set(user.role === RolesEnums.HighManagement);
        }
      });
    }
  }

  loadGoals(): void {
    this.isLoading = true;
    this.error = null;

    this.goalService.getAllGoalsAdmin().subscribe({
      next: (response) => {
        this.goals = response.data;
        this.isLoading = false;
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) => {
        this.error = `Failed to load goals: ${err.message}`;
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    // First apply filters by category
    let results = [...this.goals];

    // Apply status filter
    if (this.filterOption === 'active') {
      results = results.filter((goal) => goal.status);
    } else if (this.filterOption === 'inactive') {
      results = results.filter((goal) => !goal.status);
    }

    // Apply search filter if there's a search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      results = results.filter(
        (goal) =>
          goal.title.toLowerCase().includes(term) ||
          (goal.text && goal.text.toLowerCase().includes(term))
      );
    }

    // Update filtered list and calculate pagination
    this.filteredGoals = results;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredGoals.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
      this.currentPage = 1;
    }
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get paginatedGoals(): GoalWithUIState[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredGoals.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  search(): void {
    this.currentPage = 1; // Reset to first page
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.search();
  }

  // Toggle individual goal status
  toggleGoalStatus(goal: GoalWithUIState): void {
    const newStatus = !goal.status;

    // Set local UI state to show spinner
    goal.updating = true;

    this.goalService.updateGoalStatus(goal.id, newStatus).subscribe({
      next: () => {
        // Update local state on success
        goal.status = newStatus;
        goal.updating = false;
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) => {
        // Revert UI on error
        goal.updating = false;
        this.error = `Failed to update goal status: ${err.message}`;
        console.error(err);
      }
    });
  }

  // Mark all goals as inactive
  confirmMarkAllInactive(): void {
    this.confirmMessage = 'هل أنت متأكد من رغبتك في إلغاء تفعيل جميع الأهداف؟ هذا الإجراء لا يمكن التراجع عنه.';
    this.confirmDangerMode = true;
    this.currentAction = ConfirmAction.MARK_ALL_INACTIVE;
    this.showConfirmDialog.set(true);
  }

  markAllInactive(): void {
    this.markingAllInactive.set(true);
    this.error = null;

    this.goalService.markAllGoalStatusFalse().subscribe({
      next: () => {
        // Update all goals in local state
        this.goals.forEach(goal => {
          goal.status = false;
        });
        this.applyFilters();
        this.markingAllInactive.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error = `Failed to update goals: ${err.message}`;
        this.markingAllInactive.set(false);
        console.error(err);
      }
    });
  }

  // Delete goal with confirmation
  confirmDelete(goal: GoalWithUIState): void {
    this.goalToDelete = goal;
    this.confirmMessage = `هل أنت متأكد من رغبتك في حذف الهدف "${goal.title}"؟`;
    this.confirmDangerMode = true;
    this.currentAction = ConfirmAction.DELETE;
    this.showConfirmDialog.set(true);
  }

  // Unified confirm action handler
  onConfirmAction(): void {
    switch(this.currentAction) {
      case ConfirmAction.DELETE:
        this.deleteGoal();
        break;
      case ConfirmAction.MARK_ALL_INACTIVE:
        this.markAllInactive();
        break;
    }
    this.showConfirmDialog.set(false);
  }

  // Unified cancel action handler
  onCancelAction(): void {
    this.goalToDelete = null;
    this.showConfirmDialog.set(false);
  }

  private deleteGoal(): void {
    if (this.goalToDelete) {
      this.isLoading = true;
      this.error = null;

      this.goalService.deleteGoal(this.goalToDelete.id).subscribe({
        next: () => {
          // Remove the deleted goal from local array
          this.goals = this.goals.filter(goal => goal.id !== this.goalToDelete?.id);
          this.applyFilters();
          this.goalToDelete = null;
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.error = `Failed to delete goal: ${err.message}`;
          this.isLoading = false;
          console.error(err);
        }
      });
    }
  }
}
