import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedDataService } from '../../../../Core/Service/shared-data.service';
import { ObjectiveService } from '../../services/objective.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-objectives-stage-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './objectives-stage-add.component.html',
  styleUrl: './objectives-stage-add.component.css',
})
export class ObjectivesStageAddComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() title!: string;
  @Input() objectiveId?: string; // Add this to handle edit mode
  @Output() closeModal = new EventEmitter<void>();
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() detailsData: any = null;
  @Output() submitted = new EventEmitter<void>();
  @Output() refreshObjectives = new EventEmitter<void>();

  planId: string | null = null;
  objectiveForm: FormGroup;

  strengthPoints: any[] = [];

  opportunityPoints: any[] = [];

  riskPoints: any[] = [];

  threatPoints: any[] = [];

  constructor(
    private fb: FormBuilder,
    private sharedDataService: SharedDataService,
    private objectiveService: ObjectiveService,
    private route: ActivatedRoute
  ) {
    this.objectiveForm = this.fb.group({
      selectedStrengthPoints: [[]],
      selectedOpportunityPoints: [[]],
      selectedRiskPoints: [[]],
      selectedThreatPoints: [[]],
      objectiveTitle: ['', [Validators.required]],
      objectiveDescription: ['', [Validators.required]],
      mainIndicator: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.planId = this.route.snapshot.paramMap.get('planId');

    this.getAnalysisData();
  }

  ngOnChanges(): void {
    // Reset form when modal opens/closes or mode changes
    if (this.isOpen && this.mode === 'create') {
      this.resetForm();
    } else if (this.isOpen && this.mode === 'edit') {
      this.loadObjectiveData();
    }
  }

  onClose(): void {
    this.closeModal.emit();
    this.resetForm();
  }

  private resetForm(): void {
    this.objectiveForm.reset({
      selectedStrengthPoints: [],
      selectedOpportunityPoints: [],
      selectedRiskPoints: [],
      selectedThreatPoints: [],
      objectiveTitle: '',
      objectiveDescription: '',
      mainIndicator: '',
    });
    this.objectiveForm.markAsUntouched();
    this.objectiveForm.markAsPristine();
  }

  loadObjectiveData() {
    if (this.mode === 'edit' && this.detailsData) {
      console.log('Loading objective data for edit mode:', this.detailsData);

      this.objectiveId = this.detailsData.id;

      // Helper function to safely extract value
      const getValue = (field: any) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        if (typeof field === 'object' && field.value !== undefined)
          return field.value;
        return field.toString();
      };

      const formValues = {
        objectiveTitle: getValue(this.detailsData.name),
        objectiveDescription: getValue(this.detailsData.descripition),
        mainIndicator: getValue(this.detailsData.indicator),
        selectedStrengthPoints: this.detailsData.strength || [],
        selectedOpportunityPoints: this.detailsData.opportunity || [],
        selectedRiskPoints: this.detailsData.risk || [],
        selectedThreatPoints: this.detailsData.threat || [],
      };

      console.log('Form values to patch:', formValues);

      this.objectiveForm.patchValue(formValues);

      console.log('Form after patching:', this.objectiveForm.value);
    }
  }

  onSubmit(): void {
    // Mark all fields as touched to show validation messages
    this.objectiveForm.markAllAsTouched();

    if (this.objectiveForm.valid) {
      const planId = this.sharedDataService.getPlanId();

      const selectedStrengthPoints =
        this.objectiveForm.get('selectedStrengthPoints')?.value || [];
      const selectedOpportunityPoints =
        this.objectiveForm.get('selectedOpportunityPoints')?.value || [];
      const selectedRiskPoints =
        this.objectiveForm.get('selectedRiskPoints')?.value || [];
      const selectedThreatPoints =
        this.objectiveForm.get('selectedThreatPoints')?.value || [];

      const allSelectedPoints = [
        ...selectedStrengthPoints.map((point: any) => point.id),
        ...selectedOpportunityPoints.map((point: any) => point.id),
        ...selectedRiskPoints.map((point: any) => point.id),
        ...selectedThreatPoints.map((point: any) => point.id),
      ];

      const formData = {
        id: this.mode === 'edit' ? this.objectiveId : undefined,
        name: this.objectiveForm.get('objectiveTitle')?.value,
        description: this.objectiveForm.get('objectiveDescription')?.value,
        indicator: this.objectiveForm.get('mainIndicator')?.value,
        analysisPoints: allSelectedPoints,
      };

      console.log('Submitting form data:', formData);

      if (this.mode === 'create') {
        this.objectiveService.createPlanGoal(planId, formData).subscribe({
          next: (response) => {
            console.log('Goal created successfully:', response);
            this.submitted.emit();
            this.onClose();
            this.refreshObjectives.emit();
          },
          error: (error) => {
            console.error('Error creating goal:', error);
          },
        });
      } else {
        this.objectiveService.updateGoal(formData).subscribe({
          next: (response) => {
            console.log('Goal updated successfully:', response);
            this.submitted.emit();
            this.onClose();
            this.refreshObjectives.emit();
          },
          error: (error) => {
            console.error('Error updating goal:', error);
          },
        });
      }
    } else {
      console.log('Form is invalid. Errors:', this.getFormValidationErrors());
    }
  }

  // Helper method to get form validation errors for debugging
  private getFormValidationErrors() {
    const errors: any = {};
    Object.keys(this.objectiveForm.controls).forEach((key) => {
      const controlErrors = this.objectiveForm.get(key)?.errors;
      if (controlErrors) {
        errors[key] = controlErrors;
      }
    });
    return errors;
  }

  private getAnalysisData() {
    this.objectiveService.getAcceptablePoints(this.planId!).subscribe({
      next: (res) => {
        this.strengthPoints = res.streanth || [];
        this.opportunityPoints = res.opportunities || [];
        this.riskPoints = res.risks || [];
        this.threatPoints = res.threats || [];
      },
    });
  }
}
