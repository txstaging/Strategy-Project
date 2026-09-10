import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { BlogService } from '../../services/blog.service';
import { IGetBlogById } from '../../interfaces/IGetBlogById';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ConfirmDialogComponent,
    PagesHeaderComponent,
    DatePipe
  ],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.css',
})
export class BlogDetailComponent implements OnInit {
  blogId!: number;
  blog = signal<IGetBlogById | null>(null);

  // Services
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private blogService = inject(BlogService);

  // Permission signal
  isHighManagement = signal(false);

  // Loading and error states
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Confirmation dialog
  showConfirmDialog = signal(false);
  confirmMessage = signal('هل أنت متأكد من رغبتك في حذف هذا الخبر؟');

  ngOnInit(): void {
    // Check user permissions
    this.checkUserRole();

    this.route.params.subscribe((params) => {
      this.blogId = +params['id'];
      this.loadBlogDetails();
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

  loadBlogDetails(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.blogService.getBlogById(this.blogId).subscribe({
      next: (response) => {
        this.blog.set(response.data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(`Failed to load blog: ${err.message}`);
        this.isLoading.set(false);
        console.error(err);
        // Redirect back to blogs list if the blog doesn't exist
        this.router.navigate(['/blogs']);
      }
    });
  }

  goBack(): void {
    window.history.back();
  }

  editBlog(): void {
    // Check if user has permission to edit blogs
    if (!this.isHighManagement()) {
      console.warn('Access denied: Only high management can edit blogs');
      return;
    }

    const currentBlog = this.blog();
    if (currentBlog) {
      // Navigate to edit form
      this.router.navigate(['/blogs/edit', currentBlog.id]);
    }
  }

  confirmDelete(): void {
    // Check if user has permission to delete blogs
    if (!this.isHighManagement()) {
      console.warn('Access denied: Only high management can delete blogs');
      return;
    }

    const currentBlog = this.blog();
    if (currentBlog) {
      this.confirmMessage.set(`هل أنت متأكد من رغبتك في حذف الخبر "${currentBlog.title}"؟`);
      this.showConfirmDialog.set(true);
    }
  }

  onDeleteConfirmed(): void {
    const currentBlog = this.blog();
    if (currentBlog) {
      this.isLoading.set(true);
      this.error.set(null);

      this.blogService.deleteBlog(currentBlog.id).subscribe({
        next: () => {
          this.isLoading.set(false);
          // On successful delete, navigate back to blogs list
          this.router.navigate(['/blogs']);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(`Failed to delete blog: ${err.message}`);
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
