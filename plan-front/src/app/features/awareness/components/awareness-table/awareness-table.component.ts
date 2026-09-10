import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { AwarenessService } from '../../services/awareness.service';
import { IGetAllAwareness } from '../../interfaces/IGetAllAwareness';
import { HttpErrorResponse } from '@angular/common/http';
import { PageTitleService } from '../../../page-titles/services/page-title.service';

// Extended interface to track UI state for each awareness item
interface AwarenessWithUIState extends IGetAllAwareness {
  updating?: boolean;
}

enum ConfirmAction {
  DELETE,
  MARK_ALL_INACTIVE
}

@Component({
  selector: 'app-awareness-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ConfirmDialogComponent,
    PagesHeaderComponent,
    DatePipe
  ],
  templateUrl: './awareness-table.component.html',
  styleUrl: './awareness-table.component.css',
})
export class AwarenessTableComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  private awarenessService = inject(AwarenessService);
  private pageTitleService = inject(PageTitleService);
  titlesMap = signal<Record<string, string>>({});

  // Permission signal
  isHighManagement = signal(false);

  // Special operation statuses
  markingAllInactive = signal(false);

  // Table data
  awarenessItems: AwarenessWithUIState[] = [];
  filteredAwareness: AwarenessWithUIState[] = [];

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
  itemToDelete: AwarenessWithUIState | null = null;

  // Loading and error states
  isLoading = false;
  error: string | null = null;

  ngOnInit(): void {
    // Check user permissions
    this.checkUserRole();

    // Load data
    this.loadAwareness();
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
          // Only high management can edit awareness
          this.isHighManagement.set(user.role === RolesEnums.HighManagement);
        }
      });
    }
  }

  loadAwareness(): void {
    this.isLoading = true;
    this.error = null;

    this.awarenessService.getAllAwarenessAdmin().subscribe({
      next: (response) => {
        this.awarenessItems = response.data;
        this.isLoading = false;
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) => {
        this.error = `Failed to load awareness: ${err.message}`;
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    // First apply filters by category
    let results = [...this.awarenessItems];

    // Apply status filter
    if (this.filterOption === 'active') {
      results = results.filter((item) => item.status);
    } else if (this.filterOption === 'inactive') {
      results = results.filter((item) => !item.status);
    }

    // Apply search filter if there's a search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(term) ||
          (item.text && item.text.toLowerCase().includes(term))
      );
    }

    // Update filtered list and calculate pagination
    this.filteredAwareness = results;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAwareness.length / this.itemsPerPage);
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

  get paginatedAwareness(): AwarenessWithUIState[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredAwareness.slice(startIndex, startIndex + this.itemsPerPage);
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

  // Toggle individual awareness status
  toggleAwarenessStatus(item: AwarenessWithUIState): void {
    const newStatus = !item.status;

    // Set local UI state to show spinner
    item.updating = true;

    this.awarenessService.updateAwarenessStatus(item.id, newStatus).subscribe({
      next: () => {
        // Update local state on success
        item.status = newStatus;
        item.updating = false;
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) => {
        // Revert UI on error
        item.updating = false;
        this.error = `Failed to update awareness status: ${err.message}`;
        console.error(err);
      }
    });
  }

  // Mark all awareness as inactive
  confirmMarkAllInactive(): void {
    this.confirmMessage = 'هل أنت متأكد من رغبتك في إلغاء تفعيل جميع مواضيع التوعية؟ هذا الإجراء لا يمكن التراجع عنه.';
    this.confirmDangerMode = true;
    this.currentAction = ConfirmAction.MARK_ALL_INACTIVE;
    this.showConfirmDialog.set(true);
  }

  markAllInactive(): void {
    this.markingAllInactive.set(true);
    this.error = null;

    this.awarenessService.markAllAwarenessStatusFalse().subscribe({
      next: () => {
        // Update all items in local state
        this.awarenessItems.forEach(item => {
          item.status = false;
        });
        this.applyFilters();
        this.markingAllInactive.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error = `Failed to update awareness: ${err.message}`;
        this.markingAllInactive.set(false);
        console.error(err);
      }
    });
  }

  // Delete awareness with confirmation
  confirmDelete(item: AwarenessWithUIState): void {
    this.itemToDelete = item;
    this.confirmMessage = `هل أنت متأكد من رغبتك في حذف الموضوع "${item.title}"؟`;
    this.confirmDangerMode = true;
    this.currentAction = ConfirmAction.DELETE;
    this.showConfirmDialog.set(true);
  }

  // Unified confirm action handler
  onConfirmAction(): void {
    switch(this.currentAction) {
      case ConfirmAction.DELETE:
        this.deleteAwareness();
        break;
      case ConfirmAction.MARK_ALL_INACTIVE:
        this.markAllInactive();
        break;
    }
    this.showConfirmDialog.set(false);
  }

  // Unified cancel action handler
  onCancelAction(): void {
    this.itemToDelete = null;
    this.showConfirmDialog.set(false);
  }

  private deleteAwareness(): void {
    if (this.itemToDelete) {
      this.isLoading = true;
      this.error = null;

      this.awarenessService.deleteAwareness(this.itemToDelete.id).subscribe({
        next: () => {
          // Remove the deleted item from local array
          this.awarenessItems = this.awarenessItems.filter(item => item.id !== this.itemToDelete?.id);
          this.applyFilters();
          this.itemToDelete = null;
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.error = `Failed to delete awareness: ${err.message}`;
          this.isLoading = false;
          console.error(err);
        }
      });
    }
  }
}
