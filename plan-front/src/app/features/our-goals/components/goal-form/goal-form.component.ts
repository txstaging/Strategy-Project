import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JoditAngularModule } from 'jodit-angular';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { PagesHeaderComponent } from '../../../../shared/components/pages-header/pages-header.component';
import { GoalService } from '../../services/goal.service';
import { HttpErrorResponse } from '@angular/common/http';
import { IGetGoalById } from '../../interfaces/IGetGoalById';

@Component({
  selector: 'app-goal-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    JoditAngularModule,
    PagesHeaderComponent,
  ],
  templateUrl: './goal-form.component.html',
  styleUrl: './goal-form.component.css',
})
export class GoalFormComponent implements OnInit {
  // Reference to file input element
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Services
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private goalService = inject(GoalService);

  // Form
  goalForm!: FormGroup;
  formSubmitted = false;
  editorContent = '';

  // File upload tracking
  private selectedFile: File | null = null;
  private originalImagePath: string | null = null;

  // State signals
  isEditMode = signal(false);
  imagePreview = signal<string | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  goalId = signal<number | null>(null);

  // Editor configuration
  editorConfig = {
    language: 'ar',
    direction: 'rtl',
    toolbarButtonSize: 'small',
    buttons: [
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'font',
      'fontsize',
      'brush',
      'paragraph',
      '|',
      'align',
      'undo',
      'redo',
      '|',
      'table',
      'link',
      'image',
      'hr',
      '|',
      'source',
    ],
    uploader: {
      insertImageAsBase64URI: true,
    },
    minHeight: 300,
    placeholder: 'أدخل محتوى الهدف هنا...',
    events: {
      change: (content: string) => {
        this.handleEditorChange(content);
      }
    }
  };

  ngOnInit(): void {
    // Initialize the form
    this.initForm();

    // Check if we're in edit mode (URL contains an ID)
    const goalId = this.route.snapshot.paramMap.get('id');
    if (goalId) {
      const id = +goalId;
      this.goalId.set(id);
      this.isEditMode.set(true);
      this.loadGoalData(id);
    }
  }

  // Check if user has admin access
  get isAdmin(): boolean {
    // Use the currentUser observable instead
    return this.authService.currentUser?.value?.role === RolesEnums.HighManagement;
  }

  initForm(): void {
    this.goalForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      date: [this.formatDate(new Date()), Validators.required],
      text: ['', Validators.required],
      status: [true], // Default to true (active)
    });
  }

  handleEditorChange(content: string): void {
    this.editorContent = content;
    this.goalForm.patchValue({ text: content });
  }

  loadGoalData(goalId: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.goalService.getGoalById(goalId).subscribe({
      next: (response) => {
        const goal: IGetGoalById = response.data;

        // Update form with goal data
        this.goalForm.patchValue({
          title: goal.title,
          date: goal.date,
          text: goal.text,
          status: goal.status
        });
        // Set editor content (Jodit doesn't always update via formControl)
        this.editorContent = goal.text;

        // Set image preview if available
        if (goal.imagePath) {
          this.originalImagePath = goal.imagePath;
          this.imagePreview.set(goal.imagePath);
        }

        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(`Failed to load goal: ${err.message}`);
        this.isLoading.set(false);
        console.error(err);
        // Redirect back to goals on error
        this.router.navigate(['/our-goals']);
      }
    });
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;

    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];

      // Check if file is an image
      if (!file.type.includes('image/')) {
        alert('Please select an image file');
        return;
      }

      // Store the selected file
      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.imagePreview.set(null);
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onSubmit(): void {
    this.formSubmitted = true;

    // Check form validity, but use the direct editorContent for Jodit
    if (
      this.goalForm.get('title')?.invalid ||
      this.goalForm.get('date')?.invalid ||
      !this.editorContent
    ) {
      // Mark form fields as touched to display validation errors
      Object.keys(this.goalForm.controls).forEach((key) => {
        this.goalForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const formData = new FormData();
    const formValues = this.goalForm.value;

    // Add form values to FormData with capitalized keys
    formData.append('Title', formValues.title);
    formData.append('Date', formValues.date);
    formData.append('Text', this.editorContent); // Use direct content from editor
    formData.append('Status', formValues.status);

    if (this.isEditMode()) {
      // For edit mode, include ID
      const id = this.goalId();
      if (id) {
        formData.append('Id', id.toString());

        // Only append the file if a new one has been selected
        if (this.selectedFile) {
          formData.append('Image', this.selectedFile);
        }

        this.goalService.updateGoal(formData).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.router.navigate(['/our-goals']);
          },
          error: (err: HttpErrorResponse) => {
            this.error.set(`Failed to update goal: ${err.message}`);
            this.isLoading.set(false);
            console.error(err);
          }
        });
      }
    } else {
      if (this.selectedFile) {
        formData.append('Image', this.selectedFile);
      }

      this.goalService.addGoal(formData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/our-goals']);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(`Failed to create goal: ${err.message}`);
          this.isLoading.set(false);
          console.error(err);
        }
      });
    }
  }

  cancel(): void {
    // Navigate back to goals page
    this.router.navigate(['/our-goals']);
  }

  private formatDate(date: Date): string {
    // Format date as YYYY-MM-DD for input type="date"
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
