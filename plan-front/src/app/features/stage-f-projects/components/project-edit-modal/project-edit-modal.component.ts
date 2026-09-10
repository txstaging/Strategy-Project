import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PlanProjectsService } from '../../services/plan-projects.service';
import { IGetProjectByIdResponse } from '../../interfaces/IGetProjectById';
import { IUpdateProjectBody } from '../../interfaces/IUpdateProjectBody';

@Component({
  selector: 'app-project-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './project-edit-modal.component.html',
  styleUrl: './project-edit-modal.component.css',
})
export class ProjectEditModalComponent implements OnInit {
  @Input() projectDetails!: IGetProjectByIdResponse;
  @Input() planId!: string;
  @Output() closeModal = new EventEmitter<void>();
  @Output() projectUpdated = new EventEmitter<void>();

  private readonly planProjectsService = inject(PlanProjectsService);

  readonly submitting = signal(false);

  readonly projectForm = new FormGroup({
    id: new FormControl<number>(0, [Validators.required]),
    name: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(3),
    ]),
    priority: new FormControl<string>('', [Validators.required]),
    duration: new FormControl<string>('', [Validators.required]),
    beneficiaries: new FormControl<string>('', [Validators.required]),
    supervisingAuthority: new FormControl<string>('', [Validators.required]),
    weight: new FormControl<string>('', [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
    ]),
    code: new FormControl<string>('', [Validators.required]),
    planInitiativeId: new FormControl<number>(0, [Validators.required]),
    planGoalsId: new FormControl<number>(0, [Validators.required]),
    startDate: new FormControl<string>('', [Validators.required]),
    endDate: new FormControl<string>('', [Validators.required]),
  });

  ngOnInit() {
    if (this.projectDetails) {
      // Helper function to safely get value from either flat or nested structure
      const getValue = (field: any): string => {
        if (!field) return '';
        // If it's a nested object with 'value' property, return field.value
        if (typeof field === 'object' && field.value !== undefined) {
          return field.value;
        }
        // If it's a direct value, return it
        return field.toString();
      };

      // Helper function specifically for getting IDs with fallback to nested objects
      const getIdValue = (directId: any, nestedObject: any): number => {
        // If we have a direct ID value and it's not null, use it
        if (directId !== null && directId !== undefined) {
          return Number(directId) || 0;
        }
        // Fallback to nested object ID if direct ID is null/undefined
        if (nestedObject && nestedObject.id !== undefined) {
          return Number(nestedObject.id) || 0;
        }
        return 0;
      };

      // Helper function to format dates to yyyy-MM-dd format
      const formatDateForApi = (dateString: string): string => {
        if (!dateString) return '';

        try {
          // Handle different possible input formats
          const date = new Date(dateString);

          // Check if date is valid
          if (isNaN(date.getTime())) {
            console.warn('Invalid date received:', dateString);
            return '';
          }

          // Format as yyyy-MM-dd
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');

          return `${year}-${month}-${day}`;
        } catch (error) {
          console.error('Error formatting date:', dateString, error);
          return '';
        }
      };

      this.projectForm.patchValue({
        id: this.projectDetails.id,
        name: getValue(this.projectDetails.name),
        priority: getValue(this.projectDetails.priority),
        duration: getValue(this.projectDetails.duration),
        beneficiaries: getValue(this.projectDetails.beneficiaries),
        supervisingAuthority: getValue(
          this.projectDetails.supervisingAuthority
        ),
        weight: getValue(this.projectDetails.weight),
        code: getValue(this.projectDetails.code),
        planInitiativeId: getIdValue(
          this.projectDetails.planInitiativeId,
          this.projectDetails.planInitiative
        ),
        planGoalsId: getIdValue(
          this.projectDetails.planGoalsId,
          this.projectDetails.planGoals
        ),
        startDate: formatDateForApi(this.projectDetails.startDate),
        endDate: formatDateForApi(this.projectDetails.endDate),
      });
    }
  }

  close() {
    this.closeModal.emit();
  }

  onSubmit() {
    if (this.projectForm.valid && !this.submitting()) {
      this.submitting.set(true);

      // Helper function to ensure dates are in yyyy-MM-dd format
      const ensureDateFormat = (dateString: string): string => {
        if (!dateString) return '';

        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
          }

          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');

          return `${year}-${month}-${day}`;
        } catch (error) {
          console.error(
            'Error formatting date for submission:',
            dateString,
            error
          );
          return '';
        }
      };

      const formValues = this.projectForm.value;
      const formData: IUpdateProjectBody = {
        id: formValues.id!,
        name: formValues.name!,
        priority: formValues.priority!,
        duration: formValues.duration!,
        beneficiaries: formValues.beneficiaries!,
        supervisingAuthority: formValues.supervisingAuthority!,
        weight: formValues.weight!,
        code: formValues.code!,
        planInitiativeId: formValues.planInitiativeId!,
        planGoalsId: formValues.planGoalsId!,
        startDate: ensureDateFormat(formValues.startDate!),
        endDate: ensureDateFormat(formValues.endDate!),
      };

      this.planProjectsService
        .updatePlanProject(this.planId, formData)
        .subscribe({
          next: () => {
            this.submitting.set(false);
            this.projectUpdated.emit(); // Let parent handle the refresh
            this.closeModal.emit();
          },
          error: (error) => {
            console.error('Error updating project:', error);
            this.submitting.set(false);
            // TODO: Add proper error handling/user notification
          },
        });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.projectForm.controls).forEach((key) => {
      const control = this.projectForm.get(key);
      control?.markAsTouched();
    });
  }
}
