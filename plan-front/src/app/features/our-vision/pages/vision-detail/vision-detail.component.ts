import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { VisionService } from '../../services/vision.service';
import { IGetVisionById } from '../../interfaces/IGetVisionById';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-vision-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ConfirmDialogComponent,
    PagesHeaderComponent,
    DatePipe
  ],
  templateUrl: './vision-detail.component.html',
  styleUrl: './vision-detail.component.css',
})
export class VisionDetailComponent implements OnInit {
  visionId!: number;
  vision = signal<IGetVisionById | null>(null);

  // Services
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private visionService = inject(VisionService);

  // Permission signal
  isHighManagement = signal(false);

  // Loading and error states
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Confirmation dialog
  showConfirmDialog = signal(false);
  confirmMessage = signal('هل أنت متأكد من رغبتك في حذف هذه الرؤية؟');

  ngOnInit(): void {
    // Check user permissions
    this.checkUserRole();

    this.route.params.subscribe((params) => {
      this.visionId = +params['id'];
      this.loadVisionDetails();
    });
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

  loadVisionDetails(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.visionService.getVisionById(this.visionId).subscribe({
      next: (response) => {
        this.vision.set(response.data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(`Failed to load vision: ${err.message}`);
        this.isLoading.set(false);
        console.error(err);
        // Redirect back to visions list if the vision doesn't exist
        this.router.navigate(['/our-vision']);
      }
    });
  }

  goBack(): void {
    window.history.back();
  }

  editVision(): void {
    // Check if user has permission to edit visions
    if (!this.isHighManagement()) {
      console.warn('Access denied: Only high management can edit visions');
      return;
    }

    const currentVision = this.vision();
    if (currentVision) {
      // Navigate to edit form
      this.router.navigate(['/our-vision/edit', currentVision.id]);
    }
  }

  confirmDelete(): void {
    // Check if user has permission to delete visions
    if (!this.isHighManagement()) {
      console.warn('Access denied: Only high management can delete visions');
      return;
    }

    const currentVision = this.vision();
    if (currentVision) {
      this.confirmMessage.set(`هل أنت متأكد من رغبتك في حذف الرؤية "${currentVision.title}"؟`);
      this.showConfirmDialog.set(true);
    }
  }

  onDeleteConfirmed(): void {
    const currentVision = this.vision();
    if (currentVision) {
      this.isLoading.set(true);
      this.error.set(null);

      this.visionService.deleteVision(currentVision.id).subscribe({
        next: () => {
          this.isLoading.set(false);
          // On successful delete, navigate back to visions list
          this.router.navigate(['/our-vision']);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(`Failed to delete vision: ${err.message}`);
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
