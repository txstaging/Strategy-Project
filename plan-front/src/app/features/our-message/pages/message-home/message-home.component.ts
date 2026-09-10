import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { MessageService } from '../../services/message.service';
import { IGetAllMessages } from '../../interfaces/IGetAllMessages';
import { HttpErrorResponse } from '@angular/common/http';
import { PageTitleService } from '../../../page-titles/services/page-title.service';

@Component({
  selector: 'app-message-home',
  standalone: true,
  imports: [CommonModule, RouterModule, PagesHeaderComponent, DatePipe],
  templateUrl: './message-home.component.html',
  styleUrl: './message-home.component.css',
})
export class MessageHomeComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private pageTitleService = inject(PageTitleService);
  titlesMap = signal<Record<string, string>>({});

  // Admin access control
  isAdmin = signal(false);
  isHighManagement = signal(false);

  // Loading and error states
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Messages arrays
  allMessages = signal<IGetAllMessages[]>([]);
  featuredMessages = signal<IGetAllMessages[]>([]);
  regularMessages = signal<IGetAllMessages[]>([]);

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(6); // Number of items per page for regular messages
  totalPages = signal(1);
  pages = signal<number[]>([1]);

  // Flag to show if we have enough messages to display pagination
  shouldShowPagination = signal(false);

  ngOnInit(): void {
    // Check user role for editing permissions
    this.checkUserRole();

    // Load messages
    this.loadMessages();
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
          // Only high management can edit messages
          this.isHighManagement.set(user.role === RolesEnums.HighManagement);
          this.isAdmin.set(this.isHighManagement());
        }
      });
    }
  }

  loadMessages(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.messageService.getAllMessages().subscribe({
      next: (response) => {
        // Sort messages by date (newest first)
        const messages = response.data.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        this.allMessages.set(messages);

        // Get active messages only
        const activeMessages = messages.filter(message => message.status);

        if (activeMessages.length > 0) {
          // First two active messages are featured
          this.featuredMessages.set(activeMessages.slice(0, 2));

          // Remaining active messages are regular
          this.regularMessages.set(activeMessages.slice(2));
        } else {
          this.featuredMessages.set([]);
          this.regularMessages.set([]);
        }

        // Only show pagination if we have more than 5 active messages in total
        this.shouldShowPagination.set(activeMessages.length > 5);

        // Calculate pagination
        this.calculatePagination();

        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(`Failed to load messages: ${err.message}`);
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  calculatePagination(): void {
    const totalItems = this.regularMessages().length;
    const pages = Math.ceil(totalItems / this.itemsPerPage());
    this.totalPages.set(pages > 0 ? pages : 1);
    this.pages.set(Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  get paginatedOtherMessages(): IGetAllMessages[] {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    return this.regularMessages().slice(startIndex, startIndex + this.itemsPerPage());
  }

  t(key: string, fallback: string): string {
    return this.titlesMap()[key] || fallback;
  }
}
