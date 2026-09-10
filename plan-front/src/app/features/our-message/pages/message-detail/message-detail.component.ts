import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { MessageService } from '../../services/message.service';
import { IGetMessageById } from '../../interfaces/IGetMessageById';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-message-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ConfirmDialogComponent,
    PagesHeaderComponent,
    DatePipe
  ],
  templateUrl: './message-detail.component.html',
  styleUrl: './message-detail.component.css',
})
export class MessageDetailComponent implements OnInit {
  messageId!: number;
  message = signal<IGetMessageById | null>(null);

  // Services
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  // Permission signal
  isHighManagement = signal(false);

  // Loading and error states
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Confirmation dialog
  showConfirmDialog = signal(false);
  confirmMessage = signal('هل أنت متأكد من رغبتك في حذف هذه الرسالة؟');

  ngOnInit(): void {
    // Check user permissions
    this.checkUserRole();

    this.route.params.subscribe((params) => {
      this.messageId = +params['id'];
      this.loadMessageDetails();
    });
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

  loadMessageDetails(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.messageService.getMessageById(this.messageId).subscribe({
      next: (response) => {
        this.message.set(response.data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(`Failed to load message: ${err.message}`);
        this.isLoading.set(false);
        console.error(err);
        // Redirect back to messages list if the message doesn't exist
        this.router.navigate(['/our-message']);
      }
    });
  }

  goBack(): void {
    window.history.back();
  }

  editMessage(): void {
    // Check if user has permission to edit messages
    if (!this.isHighManagement()) {
      console.warn('Access denied: Only high management can edit messages');
      return;
    }

    const currentMessage = this.message();
    if (currentMessage) {
      // Navigate to edit form
      this.router.navigate(['/our-message/edit', currentMessage.id]);
    }
  }

  confirmDelete(): void {
    // Check if user has permission to delete messages
    if (!this.isHighManagement()) {
      console.warn('Access denied: Only high management can delete messages');
      return;
    }

    const currentMessage = this.message();
    if (currentMessage) {
      this.confirmMessage.set(`هل أنت متأكد من رغبتك في حذف الرسالة "${currentMessage.title}"؟`);
      this.showConfirmDialog.set(true);
    }
  }

  onDeleteConfirmed(): void {
    const currentMessage = this.message();
    if (currentMessage) {
      this.isLoading.set(true);
      this.error.set(null);

      this.messageService.deleteMessage(currentMessage.id).subscribe({
        next: () => {
          this.isLoading.set(false);
          // On successful delete, navigate back to messages list
          this.router.navigate(['/our-message']);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(`Failed to delete message: ${err.message}`);
          this.isLoading.set(false);
          console.error(err);
        }
      });
    }
    this.showConfirmDialog.set(false);
  }

  onDeleteCancelled(): void {
    this.showConfirmDialog.set(false);
  }
}
