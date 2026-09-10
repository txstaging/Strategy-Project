import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { BlogService } from '../../services/blog.service';
import { IGetAllBlogs } from '../../interfaces/IGetAllBlogs';
import { HttpErrorResponse } from '@angular/common/http';
import { PageTitleService } from '../../../page-titles/services/page-title.service';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, RouterModule, PagesHeaderComponent, DatePipe],
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.css',
})
export class BlogsComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  private blogService = inject(BlogService);
  private pageTitleService = inject(PageTitleService);
  titlesMap = signal<Record<string, string>>({});

  // Admin access control
  isAdmin = signal(false);
  isHighManagement = signal(false);

  // Loading and error states
  isLoading = signal(false);
  error = signal<string | null>(null);

  // News arrays
  allBlogs = signal<IGetAllBlogs[]>([]);
  featuredBlogs = signal<IGetAllBlogs[]>([]);
  regularBlogs = signal<IGetAllBlogs[]>([]);

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(6); // Number of items per page for regular blogs
  totalPages = signal(1);
  pages = signal<number[]>([1]);

  // Flag to show if we have enough blogs to display pagination
  shouldShowPagination = signal(false);

  ngOnInit(): void {
    // Check user role for editing permissions
    this.checkUserRole();

    // Load blogs
    this.loadBlogs();

    // Load page titles
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
          this.isAdmin.set(this.isHighManagement());
        }
      });
    }
  }

  loadBlogs(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.blogService.getAllBlogs().subscribe({
      next: (response) => {
        // Sort blogs by date (newest first)
        const blogs = response.data.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        this.allBlogs.set(blogs);

        // Get active blogs only
        const activeBlogs = blogs.filter(blog => blog.status);

        if (activeBlogs.length > 0) {
          // First two active blogs are featured
          this.featuredBlogs.set(activeBlogs.slice(0, 2));

          // Remaining active blogs are regular
          this.regularBlogs.set(activeBlogs.slice(2));
        } else {
          this.featuredBlogs.set([]);
          this.regularBlogs.set([]);
        }

        // Only show pagination if we have more than 5 active blogs in total
        this.shouldShowPagination.set(activeBlogs.length > 5);

        // Calculate pagination
        this.calculatePagination();

        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(`Failed to load blogs: ${err.message}`);
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  calculatePagination(): void {
    const totalItems = this.regularBlogs().length;
    const pages = Math.ceil(totalItems / this.itemsPerPage());
    this.totalPages.set(pages > 0 ? pages : 1);
    this.pages.set(Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  get paginatedOtherBlogs(): IGetAllBlogs[] {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    return this.regularBlogs().slice(startIndex, startIndex + this.itemsPerPage());
  }

  t(key: string, fallback: string): string {
    return this.titlesMap()[key] || fallback;
  }
}
