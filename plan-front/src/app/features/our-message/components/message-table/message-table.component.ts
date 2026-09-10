import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { MessageService } from '../../services/message.service';
import { IGetAllMessages } from '../../interfaces/IGetAllMessages';
import { HttpErrorResponse } from '@angular/common/http';
import { PageTitleService } from '../../../page-titles/services/page-title.service';

// Extended interface to track UI state for each message
interface MessageWithUIState extends IGetAllMessages {
  updating?: boolean;
}

enum ConfirmAction {
  DELETE,
  MARK_ALL_INACTIVE
}

@Component({
  selector: 'app-message-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ConfirmDialogComponent,
    PagesHeaderComponent,
    DatePipe
  ],
  templateUrl: './message-table.component.html',
  styleUrl: './message-table.component.css',
})
export class MessageTableComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private pageTitleService = inject(PageTitleService);
  titlesMap = signal<Record<string, string>>({});

  // Permission signal
  isHighManagement = signal(false);

  // Special operation statuses
  markingAllInactive = signal(false);

  // Table data
  messages: MessageWithUIState[] = [];
  filteredMessages: MessageWithUIState[] = [];

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
  messageToDelete: MessageWithUIState | null = null;

  // Loading and error states
  isLoading = false;
  error: string | null = null;

  ngOnInit(): void {
    // Check user permissions
    this.checkUserRole();

    // Load data
    this.loadMessages();
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
          // Only high management can edit messages
          this.isHighManagement.set(user.role === RolesEnums.HighManagement);
        }
      });
    }
  }

  loadMessages(): void {
    this.isLoading = true;
    this.error = null;

    this.messageService.getAllMessagesAdmin().subscribe({
      next: (response) => {
        this.messages = response.data;
        this.isLoading = false;
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) => {
        this.error = `Failed to load messages: ${err.message}`;
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    // First apply filters by category
    let results = [...this.messages];

    // Apply status filter
    if (this.filterOption === 'active') {
      results = results.filter((message) => message.status);
    } else if (this.filterOption === 'inactive') {
      results = results.filter((message) => !message.status);
    }

    // Apply search filter if there's a search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      results = results.filter(
        (message) =>
          message.title.toLowerCase().includes(term) ||
          (message.text && message.text.toLowerCase().includes(term))
      );
    }

    // Update filtered list and calculate pagination
    this.filteredMessages = results;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredMessages.length / this.itemsPerPage);
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

  get paginatedMessages(): MessageWithUIState[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredMessages.slice(startIndex, startIndex + this.itemsPerPage);
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

  // Toggle individual message status
  toggleMessageStatus(message: MessageWithUIState): void {
    const newStatus = !message.status;

    // Set local UI state to show spinner
    message.updating = true;

    this.messageService.updateMessageStatus(message.id, newStatus).subscribe({
      next: () => {
        // Update local state on success
        message.status = newStatus;
        message.updating = false;
        this.applyFilters();
      },
      error: (err: HttpErrorResponse) => {
        // Revert UI on error
        message.updating = false;
        this.error = `Failed to update message status: ${err.message}`;
        console.error(err);
      }
    });
  }

  // Mark all messages as inactive
  confirmMarkAllInactive(): void {
    this.confirmMessage = 'هل أنت متأكد من رغبتك في إلغاء تفعيل جميع الرسائل؟ هذا الإجراء لا يمكن التراجع عنه.';
    this.confirmDangerMode = true;
    this.currentAction = ConfirmAction.MARK_ALL_INACTIVE;
    this.showConfirmDialog.set(true);
  }

  markAllInactive(): void {
    this.markingAllInactive.set(true);
    this.error = null;

    this.messageService.markAllMessageStatusFalse().subscribe({
      next: () => {
        // Update all messages in local state
        this.messages.forEach(message => {
          message.status = false;
        });
        this.applyFilters();
        this.markingAllInactive.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error = `Failed to update messages: ${err.message}`;
        this.markingAllInactive.set(false);
        console.error(err);
      }
    });
  }

  // Delete message with confirmation
  confirmDelete(message: MessageWithUIState): void {
    this.messageToDelete = message;
    this.confirmMessage = `هل أنت متأكد من رغبتك في حذف الرسالة "${message.title}"؟`;
    this.confirmDangerMode = true;
    this.currentAction = ConfirmAction.DELETE;
    this.showConfirmDialog.set(true);
  }

  // Unified confirm action handler
  onConfirmAction(): void {
    switch(this.currentAction) {
      case ConfirmAction.DELETE:
        this.deleteMessage();
        break;
      case ConfirmAction.MARK_ALL_INACTIVE:
        this.markAllInactive();
        break;
    }
    this.showConfirmDialog.set(false);
  }

  // Unified cancel action handler
  onCancelAction(): void {
    this.messageToDelete = null;
    this.showConfirmDialog.set(false);
  }

  private deleteMessage(): void {
    if (this.messageToDelete) {
      this.isLoading = true;
      this.error = null;

      this.messageService.deleteMessage(this.messageToDelete.id).subscribe({
        next: () => {
          // Remove the deleted message from local array
          this.messages = this.messages.filter(message => message.id !== this.messageToDelete?.id);
          this.applyFilters();
          this.messageToDelete = null;
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.error = `Failed to delete message: ${err.message}`;
          this.isLoading = false;
          console.error(err);
        }
      });
    }
  }
}
