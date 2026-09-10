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
import { AwarenessService } from '../../services/awareness.service';
import { HttpErrorResponse } from '@angular/common/http';
import { IGetAwarenessById } from '../../interfaces/IGetAwarenessById';

@Component({
  selector: 'app-awareness-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    JoditAngularModule,
    PagesHeaderComponent,
  ],
  templateUrl: './awareness-form.component.html',
  styleUrl: './awareness-form.component.css',
})
export class AwarenessFormComponent implements OnInit {
  // Reference to file input element
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Services
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private awarenessService = inject(AwarenessService);

  // Form
  awarenessForm!: FormGroup;
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
  awarenessId = signal<number | null>(null);

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
    placeholder: 'أدخل محتوى التوعية هنا...',
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
    const awarenessId = this.route.snapshot.paramMap.get('id');
    if (awarenessId) {
      const id = +awarenessId;
      this.awarenessId.set(id);
      this.isEditMode.set(true);
      this.loadAwarenessData(id);
    }
  }

  // Check if user has admin access
  get isAdmin(): boolean {
    // Use the currentUser observable instead
    return this.authService.currentUser?.value?.role === RolesEnums.HighManagement;
  }

  initForm(): void {
    this.awarenessForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      date: [this.formatDate(new Date()), Validators.required],
      text: ['', Validators.required],
      status: [true], // Default to true (active)
    });
  }

  handleEditorChange(content: string): void {
    this.editorContent = content;
    this.awarenessForm.patchValue({ text: content });
  }

  loadAwarenessData(awarenessId: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.awarenessService.getAwarenessById(awarenessId).subscribe({
      next: (response) => {
        const awareness: IGetAwarenessById = response.data;

        // Update form with awareness data
        this.awarenessForm.patchValue({
          title: awareness.title,
          date: awareness.date,
          text: awareness.text,
          status: awareness.status
        });
        // Set editor content (Jodit doesn't always update via formControl)
        this.editorContent = awareness.text;

        // Set image preview if available
        if (awareness.imagePath) {
          this.originalImagePath = awareness.imagePath;
          this.imagePreview.set(awareness.imagePath);
        }

        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(`Failed to load awareness: ${err.message}`);
        this.isLoading.set(false);
        console.error(err);
        // Redirect back to awareness on error
        this.router.navigate(['/awareness']);
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
      this.awarenessForm.get('title')?.invalid ||
      this.awarenessForm.get('date')?.invalid ||
      !this.editorContent
    ) {
      // Mark form fields as touched to display validation errors
      Object.keys(this.awarenessForm.controls).forEach((key) => {
        this.awarenessForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const formData = new FormData();
    const formValues = this.awarenessForm.value;

    // Add form values to FormData with capitalized keys
    formData.append('Title', formValues.title);
    formData.append('Date', formValues.date);
    formData.append('Text', this.editorContent); // Use direct content from editor
    formData.append('Status', formValues.status);

    if (this.isEditMode()) {
      // For edit mode, include ID
      const id = this.awarenessId();
      if (id) {
        formData.append('Id', id.toString());

        // Only append the file if a new one has been selected
        if (this.selectedFile) {
          formData.append('Image', this.selectedFile);
        }

        this.awarenessService.updateAwareness(formData).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.router.navigate(['/awareness']);
          },
          error: (err: HttpErrorResponse) => {
            this.error.set(`Failed to update awareness: ${err.message}`);
            this.isLoading.set(false);
            console.error(err);
          }
        });
      }
    } else {
      if (this.selectedFile) {
        formData.append('Image', this.selectedFile);
      }

      this.awarenessService.addAwareness(formData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/awareness']);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(`Failed to create awareness: ${err.message}`);
          this.isLoading.set(false);
          console.error(err);
        }
      });
    }
  }

  cancel(): void {
    // Navigate back to awareness page
    this.router.navigate(['/awareness']);
  }

  private formatDate(date: Date): string {
    // Format date as YYYY-MM-DD for input type="date"
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
