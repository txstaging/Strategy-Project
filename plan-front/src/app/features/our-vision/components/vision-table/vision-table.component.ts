import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { VisionService } from '../../services/vision.service';
import { IGetAllVisions } from '../../interfaces/IGetAllVisions';
import { HttpErrorResponse } from '@angular/common/http';
import { PageTitleService } from '../../../page-titles/services/page-title.service';

// Extended interface to track UI state for each vision
interface VisionWithUIState extends IGetAllVisions {
  updating?: boolean;
}

enum ConfirmAction {
  DELETE,
  MARK_ALL_INACTIVE
}

@Component({
  selector: 'app-vision-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ConfirmDialogComponent,
    PagesHeaderComponent,
    DatePipe
  ],
  templateUrl: './vision-table.component.html',
  styleUrl: './vision-table.component.css',
})
export class VisionTableComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  private visionService = inject(VisionService);
  private pageTitleService = inject(PageTitleService);
  titlesMap = signal<Record<string, string>>({});

  // Permission signal
  isHighManagement = signal(false);

  // Special operation statuses
  markingAllInactive = signal(false);

  // Table data
  visions: VisionWithUIState[] = [];
  filteredVisions: VisionWithUIState[] = [];

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
  visionToDelete: VisionWithUIState | null = null;

  // Loading and error states
  isLoading = false;
  error: string | null = null;

  ngOnInit(): void {
    // Check user permissions
    this.checkUserRole();

    // Load data
    this.loadVisions();
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
          // Only high management can edit visions
          this.isHighManagement.set(user.role === RolesEnums.HighManagement);
        }
      });
    }
  }

  loadVisions(): void {
    this.isLoading = true;
    this.error = null;

    this.visionService.getAllVisionsAdmin().subscribe({
      next: (response) => {
        this.visions = response.data;
        this.isLoading = false;
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) => {
        this.error = `Failed to load visions: ${err.message}`;
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    // First apply filters by category
    let results = [...this.visions];

    // Apply status filter
    if (this.filterOption === 'active') {
      results = results.filter((vision) => vision.status);
    } else if (this.filterOption === 'inactive') {
      results = results.filter((vision) => !vision.status);
    }

    // Apply search filter if there's a search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      results = results.filter(
        (vision) =>
          vision.title.toLowerCase().includes(term) ||
          (vision.text && vision.text.toLowerCase().includes(term))
      );
    }

    // Update filtered list and calculate pagination
    this.filteredVisions = results;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredVisions.length / this.itemsPerPage);
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

  get paginatedVisions(): VisionWithUIState[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredVisions.slice(startIndex, startIndex + this.itemsPerPage);
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

  // Toggle individual vision status
  toggleVisionStatus(vision: VisionWithUIState): void {
    const newStatus = !vision.status;

    // Set local UI state to show spinner
    vision.updating = true;

    this.visionService.updateVisionStatus(vision.id, newStatus).subscribe({
      next: () => {
        // Update local state on success
        vision.status = newStatus;
        vision.updating = false;
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) => {
        // Revert UI on error
        vision.updating = false;
        this.error = `Failed to update vision status: ${err.message}`;
        console.error(err);
      }
    });
  }

  // Mark all visions as inactive
  confirmMarkAllInactive(): void {
    this.confirmMessage = 'هل أنت متأكد من رغبتك في إلغاء تفعيل جميع الرؤى؟ هذا الإجراء لا يمكن التراجع عنه.';
    this.confirmDangerMode = true;
    this.currentAction = ConfirmAction.MARK_ALL_INACTIVE;
    this.showConfirmDialog.set(true);
  }

  markAllInactive(): void {
    this.markingAllInactive.set(true);
    this.error = null;

    this.visionService.markAllVisionStatusFalse().subscribe({
      next: () => {
        // Update all visions in local state
        this.visions.forEach(vision => {
          vision.status = false;
        });
        this.applyFilters();
        this.markingAllInactive.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error = `Failed to update visions: ${err.message}`;
        this.markingAllInactive.set(false);
        console.error(err);
      }
    });
  }

  // Delete vision with confirmation
  confirmDelete(vision: VisionWithUIState): void {
    this.visionToDelete = vision;
    this.confirmMessage = `هل أنت متأكد من رغبتك في حذف الرؤية "${vision.title}"؟`;
    this.confirmDangerMode = true;
    this.currentAction = ConfirmAction.DELETE;
    this.showConfirmDialog.set(true);
  }

  // Unified confirm action handler
  onConfirmAction(): void {
    switch(this.currentAction) {
      case ConfirmAction.DELETE:
        this.deleteVision();
        break;
      case ConfirmAction.MARK_ALL_INACTIVE:
        this.markAllInactive();
        break;
    }
    this.showConfirmDialog.set(false);
  }

  // Unified cancel action handler
  onCancelAction(): void {
    this.visionToDelete = null;
    this.showConfirmDialog.set(false);
  }

  private deleteVision(): void {
    if (this.visionToDelete) {
      this.isLoading = true;
      this.error = null;

      this.visionService.deleteVision(this.visionToDelete.id).subscribe({
        next: () => {
          // Remove the deleted vision from local array
          this.visions = this.visions.filter(vision => vision.id !== this.visionToDelete?.id);
          this.applyFilters();
          this.visionToDelete = null;
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.error = `Failed to delete vision: ${err.message}`;
          this.isLoading = false;
          console.error(err);
        }
      });
    }
  }
}
