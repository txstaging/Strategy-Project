import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { GoalService } from '../../services/goal.service';
import { IGetGoalById } from '../../interfaces/IGetGoalById';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-goal-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ConfirmDialogComponent,
    PagesHeaderComponent,
    DatePipe
  ],
  templateUrl: './goal-detail.component.html',
  styleUrl: './goal-detail.component.css',
})
export class GoalDetailComponent implements OnInit {
  goalId!: number;
  goal = signal<IGetGoalById | null>(null);

  // Services
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private goalService = inject(GoalService);

  // Permission signal
  isHighManagement = signal(false);

  // Loading and error states
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Confirmation dialog
  showConfirmDialog = signal(false);
  confirmMessage = signal('هل أنت متأكد من رغبتك في حذف هذا الهدف؟');

  ngOnInit(): void {
    // Check user permissions
    this.checkUserRole();

    this.route.params.subscribe((params) => {
      this.goalId = +params['id'];
      this.loadGoalDetails();
    });
  }

  checkUserRole(): void {
    if (this.authService.currentUser) {
      this.authService.currentUser.subscribe((user) => {
        if (user) {
          // Only high management can edit goals
          this.isHighManagement.set(user.role === RolesEnums.HighManagement);
        }
      });
    }
  }

  loadGoalDetails(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.goalService.getGoalById(this.goalId).subscribe({
      next: (response) => {
        this.goal.set(response.data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(`Failed to load goal: ${err.message}`);
        this.isLoading.set(false);
        console.error(err);
        // Redirect back to goals list if the goal doesn't exist
        this.router.navigate(['/our-goals']);
      }
    });
  }

  goBack(): void {
    window.history.back();
  }

  editGoal(): void {
    // Check if user has permission to edit goals
    if (!this.isHighManagement()) {
      console.warn('Access denied: Only high management can edit goals');
      return;
    }

    const currentGoal = this.goal();
    if (currentGoal) {
      // Navigate to edit form
      this.router.navigate(['/our-goals/edit', currentGoal.id]);
    }
  }

  confirmDelete(): void {
    // Check if user has permission to delete goals
    if (!this.isHighManagement()) {
      console.warn('Access denied: Only high management can delete goals');
      return;
    }

    const currentGoal = this.goal();
    if (currentGoal) {
      this.confirmMessage.set(`هل أنت متأكد من رغبتك في حذف الهدف "${currentGoal.title}"؟`);
      this.showConfirmDialog.set(true);
    }
  }

  onDeleteConfirmed(): void {
    const currentGoal = this.goal();
    if (currentGoal) {
      this.isLoading.set(true);
      this.error.set(null);

      this.goalService.deleteGoal(currentGoal.id).subscribe({
        next: () => {
          this.isLoading.set(false);
          // On successful delete, navigate back to goals list
          this.router.navigate(['/our-goals']);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(`Failed to delete goal: ${err.message}`);
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
