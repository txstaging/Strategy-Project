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
import { MessageService } from '../../services/message.service';
import { HttpErrorResponse } from '@angular/common/http';
import { IGetMessageById } from '../../interfaces/IGetMessageById';

@Component({
  selector: 'app-message-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    JoditAngularModule,
    PagesHeaderComponent,
  ],
  templateUrl: './message-form.component.html',
  styleUrl: './message-form.component.css',
})
export class MessageFormComponent implements OnInit {
  // Reference to file input element
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Services
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  // Form
  messageForm!: FormGroup;
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
  messageId = signal<number | null>(null);

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
    placeholder: 'أدخل محتوى الرسالة هنا...',
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
    const messageId = this.route.snapshot.paramMap.get('id');
    if (messageId) {
      const id = +messageId;
      this.messageId.set(id);
      this.isEditMode.set(true);
      this.loadMessageData(id);
    }
  }

  // Check if user has admin access
  get isAdmin(): boolean {
    // Use the currentUser observable instead
    return this.authService.currentUser?.value?.role === RolesEnums.HighManagement;
  }

  initForm(): void {
    this.messageForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      date: [this.formatDate(new Date()), Validators.required],
      text: ['', Validators.required],
      status: [true], // Default to true (active)
    });
  }

  handleEditorChange(content: string): void {
    this.editorContent = content;
    this.messageForm.patchValue({ text: content });
  }

  loadMessageData(messageId: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.messageService.getMessageById(messageId).subscribe({
      next: (response) => {
        const message: IGetMessageById = response.data;

        // Update form with message data
        this.messageForm.patchValue({
          title: message.title,
          date: message.date,
          text: message.text,
          status: message.status
        });
        // Set editor content (Jodit doesn't always update via formControl)
        this.editorContent = message.text;

        // Set image preview if available
        if (message.imagePath) {
          this.originalImagePath = message.imagePath;
          this.imagePreview.set(message.imagePath);
        }

        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(`Failed to load message: ${err.message}`);
        this.isLoading.set(false);
        console.error(err);
        // Redirect back to messages on error
        this.router.navigate(['/our-message']);
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
      this.messageForm.get('title')?.invalid ||
      this.messageForm.get('date')?.invalid ||
      !this.editorContent
    ) {
      // Mark form fields as touched to display validation errors
      Object.keys(this.messageForm.controls).forEach((key) => {
        this.messageForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const formData = new FormData();
    const formValues = this.messageForm.value;

    // Add form values to FormData with capitalized keys
    formData.append('Title', formValues.title);
    formData.append('Date', formValues.date);
    formData.append('Text', this.editorContent); // Use direct content from editor
    formData.append('Status', formValues.status);

    if (this.isEditMode()) {
      // For edit mode, include ID
      const id = this.messageId();
      if (id) {
        formData.append('Id', id.toString());

        // Only append the file if a new one has been selected
        if (this.selectedFile) {
          formData.append('Image', this.selectedFile);
        }

        this.messageService.updateMessage(formData).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.router.navigate(['/our-message']);
          },
          error: (err: HttpErrorResponse) => {
            this.error.set(`Failed to update message: ${err.message}`);
            this.isLoading.set(false);
            console.error(err);
          }
        });
      }
    } else {
      if (this.selectedFile) {
        formData.append('Image', this.selectedFile);
      }

      this.messageService.addMessage(formData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/our-message']);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(`Failed to create message: ${err.message}`);
          this.isLoading.set(false);
          console.error(err);
        }
      });
    }
  }

  cancel(): void {
    // Navigate back to messages page
    this.router.navigate(['/our-message']);
  }

  private formatDate(date: Date): string {
    // Format date as YYYY-MM-DD for input type="date"
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
