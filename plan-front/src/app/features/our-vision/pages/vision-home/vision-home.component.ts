import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { VisionService } from '../../services/vision.service';
import { IGetAllVisions } from '../../interfaces/IGetAllVisions';
import { HttpErrorResponse } from '@angular/common/http';
import { PageTitleService } from '../../../page-titles/services/page-title.service';

@Component({
  selector: 'app-vision-home',
  standalone: true,
  imports: [CommonModule, RouterModule, PagesHeaderComponent, DatePipe],
  templateUrl: './vision-home.component.html',
  styleUrl: './vision-home.component.css',
})
export class VisionHomeComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  private visionService = inject(VisionService);
  private pageTitleService = inject(PageTitleService);
  titlesMap = signal<Record<string, string>>({});

  // Admin access control
  isAdmin = signal(false);
  isHighManagement = signal(false);

  // Loading and error states
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Visions arrays
  allVisions = signal<IGetAllVisions[]>([]);
  featuredVisions = signal<IGetAllVisions[]>([]);
  regularVisions = signal<IGetAllVisions[]>([]);

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(6); // Number of items per page for regular visions
  totalPages = signal(1);
  pages = signal<number[]>([1]);

  // Flag to show if we have enough visions to display pagination
  shouldShowPagination = signal(false);

  ngOnInit(): void {
    // Check user role for editing permissions
    this.checkUserRole();

    // Load visions
    this.loadVisions();
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
          // Only high management can edit visions
          this.isHighManagement.set(user.role === RolesEnums.HighManagement);
          this.isAdmin.set(this.isHighManagement());
        }
      });
    }
  }

  loadVisions(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.visionService.getAllVisions().subscribe({
      next: (response) => {
        // Sort visions by date (newest first)
        const visions = response.data.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        this.allVisions.set(visions);

        // Get active visions only
        const activeVisions = visions.filter(vision => vision.status);

        if (activeVisions.length > 0) {
          // First two active visions are featured
          this.featuredVisions.set(activeVisions.slice(0, 2));

          // Remaining active visions are regular
          this.regularVisions.set(activeVisions.slice(2));
        } else {
          this.featuredVisions.set([]);
          this.regularVisions.set([]);
        }

        // Only show pagination if we have more than 5 active visions in total
        this.shouldShowPagination.set(activeVisions.length > 5);

        // Calculate pagination
        this.calculatePagination();

        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(`Failed to load visions: ${err.message}`);
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  calculatePagination(): void {
    const totalItems = this.regularVisions().length;
    const pages = Math.ceil(totalItems / this.itemsPerPage());
    this.totalPages.set(pages > 0 ? pages : 1);
    this.pages.set(Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  get paginatedOtherVisions(): IGetAllVisions[] {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    return this.regularVisions().slice(startIndex, startIndex + this.itemsPerPage());
  }

  t(key: string, fallback: string): string {
    return this.titlesMap()[key] || fallback;
  }
}
