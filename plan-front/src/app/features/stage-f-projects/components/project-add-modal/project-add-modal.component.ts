import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PlanProjectsService } from '../../services/plan-projects.service';
import { InitiativesService } from '../../../stage-e-initiatives/services/initiatives.service';
import { IGetAcceptableInitiativesResponse } from '../../interfaces/IGetAcceptableInitiativesResponse';

interface Goal {
  id: number;
  name: string;
}

interface ProjectToAdd {
  name: string;
  priority: string;
  duration: string;
  beneficiaries: string;
  supervisingAuthority: string;
  weight: number;
  code: string;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-project-add-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './project-add-modal.component.html',
  styleUrl: './project-add-modal.component.css',
})
export class ProjectAddModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() planId = '';
  @Output() closed = new EventEmitter<void>();
  @Output() projectAdded = new EventEmitter<void>();

  // Form for goal/initiative selection
  selectionForm!: FormGroup;
  // Form for individual project details
  projectForm!: FormGroup;

  goals: Goal[] = [];
  initiatives: IGetAcceptableInitiativesResponse[] = [];
  projectsToAdd: ProjectToAdd[] = [];
  editingProjectIndex: number | null = null;

  loadingGoals = false;
  loadingInitiatives = false;
  submitting = false;

  // Weight validation
  selectedInitiativeWeight = 0;
  currentUsedWeight = 0;
  availableWeight = 0;
  weightError = '';

  constructor(
    private fb: FormBuilder,
    private projectsService: PlanProjectsService,
    private initiativesService: InitiativesService
  ) {}

  ngOnInit() {
    this.initializeForms();
    if (this.planId) {
      this.loadGoals();
      this.loadInitiatives();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Reload data when modal opens
    if (changes['isOpen'] && this.isOpen && this.planId) {
      this.loadGoals();
      this.loadInitiatives();
      this.resetModal();
    }
  }

  initializeForms() {
    // Form for selecting goal and initiative (shared for all projects)
    this.selectionForm = this.fb.group({
      planGoalsId: [null, [Validators.required]],
      planInitiativeId: [null, [Validators.required]],
    });

    // Form for individual project details
    this.projectForm = this.fb.group({
      name: ['', [Validators.required]],
      priority: ['أولوية أولى', [Validators.required]],
      duration: ['', [Validators.required]],
      beneficiaries: ['', [Validators.required]],
      supervisingAuthority: ['', [Validators.required]],
      weight: ['', [Validators.required, Validators.min(1)]],
      code: ['', [Validators.required]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
    });

    // Watch for goal changes to load initiatives
    this.selectionForm.get('planGoalsId')?.valueChanges.subscribe((goalId) => {
      if (goalId) {
        this.loadInitiatives();
        this.selectionForm.patchValue({ planInitiativeId: null });
        this.resetWeightInfo();
      } else {
        this.initiatives = [];
        this.resetWeightInfo();
      }
    });

    // Watch for initiative changes to set weight limits
    this.selectionForm
      .get('planInitiativeId')
      ?.valueChanges.subscribe((initiativeId) => {
        if (initiativeId) {
          this.setInitiativeWeight(initiativeId);
        } else {
          this.resetWeightInfo();
        }
      });

    // Watch for weight changes to validate
    this.projectForm.get('weight')?.valueChanges.subscribe(() => {
      this.validateTotalWeight();
    });
  }

  resetModal() {
    this.selectionForm.reset();
    this.projectForm.reset({ priority: 'أولوية أولى' });
    this.projectsToAdd = [];
    this.editingProjectIndex = null;
    this.resetWeightInfo();
  }

  resetWeightInfo() {
    this.selectedInitiativeWeight = 0;
    this.currentUsedWeight = 0;
    this.availableWeight = 0;
    this.weightError = '';
  }

  setInitiativeWeight(initiativeId: number) {
    const selectedInitiative = this.initiatives.find(
      (i) => i.id === Number(initiativeId)
    );
    if (selectedInitiative) {
      // Add debugging and better null safety
      console.log('Selected initiative:', selectedInitiative);
      console.log(
        'Initiative weight from API:',
        selectedInitiative.initiativeWeight
      );

      // Use nullish coalescing operator for better type safety
      this.selectedInitiativeWeight =
        selectedInitiative.initiativeWeight ?? 100;

      console.log('Set initiative weight to:', this.selectedInitiativeWeight);
      this.calculateWeights();
    }
  }

  calculateWeights() {
    this.currentUsedWeight = this.projectsToAdd.reduce(
      (sum, project) => sum + project.weight,
      0
    );
    this.availableWeight =
      this.selectedInitiativeWeight - this.currentUsedWeight;
    this.validateTotalWeight();
  }

  validateTotalWeight() {
    this.weightError = '';
    const currentProjectWeight =
      Number(this.projectForm.get('weight')?.value) || 0;
    let totalWeight = this.currentUsedWeight + currentProjectWeight;

    if (this.editingProjectIndex !== null) {
      // If editing, subtract the original weight
      totalWeight =
        totalWeight -
        this.projectsToAdd[this.editingProjectIndex].weight +
        currentProjectWeight;
    }

    if (totalWeight > this.selectedInitiativeWeight) {
      const maxAllowed =
        this.editingProjectIndex !== null
          ? this.availableWeight +
            this.projectsToAdd[this.editingProjectIndex].weight
          : this.availableWeight;
      this.weightError = `الوزن المدخل يتجاوز الحد المسموح. الحد الأقصى المتاح: ${maxAllowed}`;
    }
  }

  loadGoals() {
    this.loadingGoals = true;
    this.initiativesService.getAcceptableInitiatives(this.planId).subscribe({
      next: (response) => {
        this.goals = response || [];
        this.loadingGoals = false;
      },
      error: (error) => {
        console.error('Error loading goals:', error);
        this.loadingGoals = false;
        this.goals = [];
      },
    });
  }

  loadInitiatives() {
    this.loadingInitiatives = true;
    this.projectsService.getAcceptableInitiative(this.planId).subscribe({
      next: (response) => {
        // Type assertion to ensure we have the correct structure
        this.initiatives = (response ||
          []) as IGetAcceptableInitiativesResponse[];
        this.loadingInitiatives = false;
        console.log('Loaded initiatives for modal:', this.initiatives);
        // Debug each initiative to see its structure
        this.initiatives.forEach((initiative, index) => {
          console.log(`Initiative ${index}:`, initiative);
          console.log(
            `Has initiativeWeight? ${Object.prototype.hasOwnProperty.call(initiative, 'initiativeWeight')}`
          );
          console.log(`initiativeWeight value:`, initiative.initiativeWeight);
        });
      },
      error: (error) => {
        console.error('Error loading initiatives:', error);
        this.initiatives = [];
        this.loadingInitiatives = false;
      },
    });
  }

  addOrUpdateProject() {
    if (!this.projectForm.valid || this.weightError) {
      this.markFormGroupTouched(this.projectForm);
      return;
    }

    const projectData: ProjectToAdd = {
      name: this.projectForm.value.name,
      priority: this.projectForm.value.priority,
      duration: this.projectForm.value.duration,
      beneficiaries: this.projectForm.value.beneficiaries,
      supervisingAuthority: this.projectForm.value.supervisingAuthority,
      weight: Number(this.projectForm.value.weight),
      code: this.projectForm.value.code,
      startDate: this.projectForm.value.startDate,
      endDate: this.projectForm.value.endDate,
    };

    if (this.editingProjectIndex !== null) {
      // Update existing project
      this.projectsToAdd[this.editingProjectIndex] = projectData;
      this.editingProjectIndex = null;
    } else {
      // Add new project
      this.projectsToAdd.push(projectData);
    }

    // Reset the project form
    this.projectForm.reset({ priority: 'أولوية أولى' });
    this.calculateWeights();
  }

  editProject(index: number) {
    const project = this.projectsToAdd[index];
    this.editingProjectIndex = index;
    this.projectForm.patchValue(project);
  }

  deleteProject(index: number) {
    this.projectsToAdd.splice(index, 1);
    if (this.editingProjectIndex === index) {
      this.editingProjectIndex = null;
      this.projectForm.reset({ priority: 'أولوية أولى' });
    } else if (
      this.editingProjectIndex !== null &&
      this.editingProjectIndex > index
    ) {
      this.editingProjectIndex--;
    }
    this.calculateWeights();
  }

  cancelEdit() {
    this.editingProjectIndex = null;
    this.projectForm.reset({ priority: 'أولوية أولى' });
    this.calculateWeights();
  }

  submitAllProjects() {
    if (!this.selectionForm.valid || this.projectsToAdd.length === 0) {
      this.markFormGroupTouched(this.selectionForm);
      return;
    }

    if (this.currentUsedWeight > this.selectedInitiativeWeight) {
      this.weightError = 'مجموع أوزان المشاريع يتجاوز وزن المبادرة';
      return;
    }

    this.submitting = true;
    const selectionData = this.selectionForm.value;

    // Prepare all projects data
    const projectsData = this.projectsToAdd.map((project) => ({
      name: project.name,
      priority: project.priority,
      duration: project.duration,
      beneficiaries: project.beneficiaries,
      supervisingAuthority: project.supervisingAuthority,
      weight: project.weight.toString(),
      code: project.code,
      planInitiativeId: Number(selectionData.planInitiativeId),
      planGoalsId: Number(selectionData.planGoalsId),
      startDate: project.startDate,
      endDate: project.endDate,
    }));

    console.log('Submitting projects data:', projectsData);

    // Create projects one by one
    this.createProjectsSequentially(projectsData, 0);
  }

  private createProjectsSequentially(projectsData: any[], index: number) {
    if (index >= projectsData.length) {
      // All projects created successfully
      this.submitting = false;
      this.projectAdded.emit();
      this.closeModal();
      return;
    }

    this.projectsService
      .createPlanProject(this.planId, projectsData[index])
      .subscribe({
        next: () => {
          // Create next project
          this.createProjectsSequentially(projectsData, index + 1);
        },
        error: (error) => {
          console.error(`Error creating project ${index + 1}:`, error);
          this.submitting = false;

          // Handle specific weight error
          if (error?.error?.message?.includes('weight exceeds')) {
            this.weightError =
              'مجموع أوزان المشاريع يتجاوز وزن المبادرة. يرجى تقليل الأوزان.';
          }
        },
      });
  }

  closeModal() {
    this.resetModal();
    this.closed.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Getters for template
  get canAddProject(): boolean {
    return (
      this.selectionForm.valid && this.projectForm.valid && !this.weightError
    );
  }

  get canSubmitAll(): boolean {
    return (
      this.selectionForm.valid &&
      this.projectsToAdd.length > 0 &&
      this.currentUsedWeight <= this.selectedInitiativeWeight &&
      !this.submitting
    );
  }

  get selectedInitiativeName(): string {
    const selectedInitiative = this.initiatives.find(
      (i) => i.id === Number(this.selectionForm.get('planInitiativeId')?.value)
    );
    return selectedInitiative?.name || '';
  }
}
