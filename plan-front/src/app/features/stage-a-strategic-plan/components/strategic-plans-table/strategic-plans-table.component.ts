import { PdfService } from './../../../../pdf.service';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { AuthService } from '../../../auth/services/auth.service';
import { StrategicPlansFormComponent } from '../strategic-plans-form/strategic-plans-form.component';
import { StagesNavigationService } from '../../services/stages-navigation.service';
import { Stages } from '../../interfaces/IStages';

@Component({
  selector: 'app-strategic-plans-table',
  standalone: true,
  imports: [CommonModule, FormsModule, StrategicPlansFormComponent],
  templateUrl: './strategic-plans-table.component.html',
  styleUrl: './strategic-plans-table.component.css',
})
export class StrategicPlansTableComponent implements OnInit {
  @Input() currentStrategicPlan: any = [];
  @Input() pagination: any = {};
  @Input() isActionPopupVisible = false;
  @Output() togglePopup = new EventEmitter<void>();
  @Output() navigateToInProgressStage = new EventEmitter<number>();
  @Output() approvePlanHighManager = new EventEmitter<number>();
  @Output() rejectPlanHighManager = new EventEmitter<number>();
  @Output() planUpdated = new EventEmitter<void>();

  // Inject the stages navigation service
  private stagesNavigationService = inject(StagesNavigationService);

  // Track the active popup row id
  activePopupId: number | null = null;

  // For dynamic stage button text
  planStages: Record<number, Stages> = {};

  constructor(
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    private PdfService:PdfService
  ) {}

  isHighManagementRole = false;
  isFormVisible = false;
  isViewOpen = false;
  planToEdit: any = null;
  isAdmin = false;

  ngOnInit(): void {
    this.updatePlanStages();

    this.isAdmin = this.authService.allowInRoles([
      RolesEnums.HighManagement,
      RolesEnums.RegionManager,
    ]);

    this.cdr.detectChanges();
  }

  // Update the stages for each plan
  public updatePlanStages(): void {
    if (
      this.currentStrategicPlan &&
      Array.isArray(this.currentStrategicPlan) &&
      this.currentStrategicPlan.length > 0
    ) {
      this.currentStrategicPlan.forEach((plan: any) => {
        if (plan && plan.id) {
          // Determine the current stage for each plan
          const stage = this.stagesNavigationService.getCurrentStage(plan);

          this.planStages[plan.id] = stage;
        }
      });
    }
  }

  // Get the button text for a specific plan
  getStageButtonText(planId: number): string {
    // If the plan stages haven't been initialized yet, return a default
    if (
      !planId ||
      !this.planStages ||
      Object.keys(this.planStages).length === 0
    ) {
      return this.stagesNavigationService.getStageButtonText(Stages.Analysis);
    }

    if (planId && this.planStages[planId]) {
      const stage = this.planStages[planId];
      const buttonText = this.stagesNavigationService.getStageButtonText(stage);
      return buttonText;
    }
    return this.stagesNavigationService.getStageButtonText(Stages.Analysis);
  }

  toggleActionPopup(): void {
    this.togglePopup.emit();
  }

  // Method to toggle action popup for a specific row
  toggleRowActionPopup(planId: number | undefined): void {
    if (planId) {
      // If clicking on the same row, toggle it off
      if (this.activePopupId === planId) {
        this.activePopupId = null;
      } else {
        // Otherwise set this row as active
        this.activePopupId = planId;
      }
    }
  }

  // Method to check if a specific row's popup should be visible
  isRowPopupVisible(planId: number | undefined): boolean {
    return !!planId && this.activePopupId === planId;
  }

  // Close all popups
  closeAllPopups(): void {
    this.activePopupId = null;
  }

  onNavigateToInProgressStage(planId: number | undefined): void {
    if (planId) {
      this.navigateToInProgressStage.emit(planId);
    }
  }

  showEditForm(plan: any) {
    this.planToEdit = plan;
    this.isFormVisible = true;
    this.closeAllPopups();
  }

  handleFormClose() {
    this.isFormVisible = false;
    this.planToEdit = null;
    this.isViewOpen = false;
  }

  showViewForm(plan: any) {
    this.planToEdit = plan;
    this.isFormVisible = true;
    this.isViewOpen = true;
    this.closeAllPopups();
  }

  handleFormSubmit() {
    if (this.planToEdit) {
      // Handle edit
    } else {
      // Handle create
    }
  }
  pdf(id:number)
  {
     this.PdfService.getPdfAll(id).subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    },
    error: (err) => {
      console.error('حصل خطأ أثناء تحميل الـ PDF', err);
    }
  });
  }
}
