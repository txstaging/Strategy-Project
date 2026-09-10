import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { BlogService } from '../../services/blog.service';
import { IGetAllBlogs } from '../../interfaces/IGetAllBlogs';
import { HttpErrorResponse } from '@angular/common/http';
import { PageTitleService } from '../../../page-titles/services/page-title.service';

// Extended interface to track UI state for each blog
interface BlogWithUIState extends IGetAllBlogs {
  updating?: boolean;
}

enum ConfirmAction {
  DELETE,
  MARK_ALL_INACTIVE
}

@Component({
  selector: 'app-blog-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ConfirmDialogComponent,
    PagesHeaderComponent,
    DatePipe
  ],
  templateUrl: './blog-table.component.html',
  styleUrl: './blog-table.component.css',
})
export class BlogTableComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  private blogService = inject(BlogService);
  private pageTitleService = inject(PageTitleService);
  titlesMap = signal<Record<string, string>>({});

  // Permission signal
  isHighManagement = signal(false);

  // Special operation statuses
  markingAllInactive = signal(false);

  // Table data
  blogs: BlogWithUIState[] = [];
  filteredBlogs: BlogWithUIState[] = [];

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
  blogToDelete: BlogWithUIState | null = null;

  // Loading and error states
  isLoading = false;
  error: string | null = null;

  ngOnInit(): void {
    // Check user permissions
    this.checkUserRole();

    // Load data
    this.loadBlogs();
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
          // Only high management can edit blogs
          this.isHighManagement.set(user.role === RolesEnums.HighManagement);
        }
      });
    }
  }

  loadBlogs(): void {
    this.isLoading = true;
    this.error = null;

    this.blogService.getAllBlogsAdmin().subscribe({
      next: (response) => {
        this.blogs = response.data;
        this.isLoading = false;
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) => {
        this.error = `Failed to load blogs: ${err.message}`;
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    // First apply filters by category
    let results = [...this.blogs];

    // Apply status filter
    if (this.filterOption === 'active') {
      results = results.filter((blog) => blog.status);
    } else if (this.filterOption === 'inactive') {
      results = results.filter((blog) => !blog.status);
    }

    // Apply search filter if there's a search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      results = results.filter(
        (blog) =>
          blog.title.toLowerCase().includes(term) ||
          (blog.text && blog.text.toLowerCase().includes(term))
      );
    }

    // Update filtered list and calculate pagination
    this.filteredBlogs = results;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredBlogs.length / this.itemsPerPage);
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

  get paginatedBlogs(): BlogWithUIState[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredBlogs.slice(startIndex, startIndex + this.itemsPerPage);
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

  // Toggle individual blog status
  toggleBlogStatus(blog: BlogWithUIState): void {
    const newStatus = !blog.status;

    // Set local UI state to show spinner
    blog.updating = true;

    this.blogService.updateBlogStatus(blog.id, newStatus).subscribe({
      next: () => {
        // Update local state on success
        blog.status = newStatus;
        blog.updating = false;
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) => {
        // Revert UI on error
        blog.updating = false;
        this.error = `Failed to update blog status: ${err.message}`;
        console.error(err);
      }
    });
  }

  // Mark all blogs as inactive
  confirmMarkAllInactive(): void {
    this.confirmMessage = 'هل أنت متأكد من رغبتك في إلغاء تفعيل جميع الأخبار؟ هذا الإجراء لا يمكن التراجع عنه.';
    this.confirmDangerMode = true;
    this.currentAction = ConfirmAction.MARK_ALL_INACTIVE;
    this.showConfirmDialog.set(true);
  }

  markAllInactive(): void {
    this.markingAllInactive.set(true);
    this.error = null;

    this.blogService.markAllBlogStatusFalse().subscribe({
      next: () => {
        // Update all blogs in local state
        this.blogs.forEach(blog => {
          blog.status = false;
        });
        this.applyFilters();
        this.markingAllInactive.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error = `Failed to update blogs: ${err.message}`;
        this.markingAllInactive.set(false);
        console.error(err);
      }
    });
  }

  // Delete blog with confirmation
  confirmDelete(blog: BlogWithUIState): void {
    this.blogToDelete = blog;
    this.confirmMessage = `هل أنت متأكد من رغبتك في حذف الخبر "${blog.title}"؟`;
    this.confirmDangerMode = true;
    this.currentAction = ConfirmAction.DELETE;
    this.showConfirmDialog.set(true);
  }

  // Unified confirm action handler
  onConfirmAction(): void {
    switch(this.currentAction) {
      case ConfirmAction.DELETE:
        this.deleteBlog();
        break;
      case ConfirmAction.MARK_ALL_INACTIVE:
        this.markAllInactive();
        break;
    }
    this.showConfirmDialog.set(false);
  }

  // Unified cancel action handler
  onCancelAction(): void {
    this.blogToDelete = null;
    this.showConfirmDialog.set(false);
  }

  private deleteBlog(): void {
    if (this.blogToDelete) {
      this.isLoading = true;
      this.error = null;

      this.blogService.deleteBlog(this.blogToDelete.id).subscribe({
        next: () => {
          // Remove the deleted blog from local array
          this.blogs = this.blogs.filter(blog => blog.id !== this.blogToDelete?.id);
          this.applyFilters();
          this.blogToDelete = null;
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.error = `Failed to delete blog: ${err.message}`;
          this.isLoading = false;
          console.error(err);
        }
      });
    }
  }

  t(key: string, fallback: string): string {
    return this.titlesMap()[key] || fallback;
  }
}

