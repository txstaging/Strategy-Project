import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { AwarenessService } from '../../services/awareness.service';
import { IGetAwarenessById } from '../../interfaces/IGetAwarenessById';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-awareness-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ConfirmDialogComponent,
    PagesHeaderComponent,
    DatePipe
  ],
  templateUrl: './awareness-detail.component.html',
  styleUrl: './awareness-detail.component.css',
})
export class AwarenessDetailComponent implements OnInit {
  awarenessId!: number;
  awareness = signal<IGetAwarenessById | null>(null);

  // Services
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private awarenessService = inject(AwarenessService);

  // Permission signal
  isHighManagement = signal(false);

  // Loading and error states
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Confirmation dialog
  showConfirmDialog = signal(false);
  confirmMessage = signal('هل أنت متأكد من رغبتك في حذف هذا الموضوع؟');

  ngOnInit(): void {
    // Check user permissions
    this.checkUserRole();

    this.route.params.subscribe((params) => {
      this.awarenessId = +params['id'];
      this.loadAwarenessDetails();
    });
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

  loadAwarenessDetails(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.awarenessService.getAwarenessById(this.awarenessId).subscribe({
      next: (response) => {
        this.awareness.set(response.data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(`Failed to load awareness: ${err.message}`);
        this.isLoading.set(false);
        console.error(err);
        // Redirect back to awareness list if the item doesn't exist
        this.router.navigate(['/awareness']);
      }
    });
  }

  goBack(): void {
    window.history.back();
  }

  editAwareness(): void {
    // Check if user has permission to edit awareness
    if (!this.isHighManagement()) {
      console.warn('Access denied: Only high management can edit awareness');
      return;
    }

    const currentAwareness = this.awareness();
    if (currentAwareness) {
      // Navigate to edit form
      this.router.navigate(['/awareness/edit', currentAwareness.id]);
    }
  }

  confirmDelete(): void {
    // Check if user has permission to delete awareness
    if (!this.isHighManagement()) {
      console.warn('Access denied: Only high management can delete awareness');
      return;
    }

    const currentAwareness = this.awareness();
    if (currentAwareness) {
      this.confirmMessage.set(`هل أنت متأكد من رغبتك في حذف الموضوع "${currentAwareness.title}"؟`);
      this.showConfirmDialog.set(true);
    }
  }

  onDeleteConfirmed(): void {
    const currentAwareness = this.awareness();
    if (currentAwareness) {
      this.isLoading.set(true);
      this.error.set(null);

      this.awarenessService.deleteAwareness(currentAwareness.id).subscribe({
        next: () => {
          this.isLoading.set(false);
          // On successful delete, navigate back to awareness list
          this.router.navigate(['/awareness']);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(`Failed to delete awareness: ${err.message}`);
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
