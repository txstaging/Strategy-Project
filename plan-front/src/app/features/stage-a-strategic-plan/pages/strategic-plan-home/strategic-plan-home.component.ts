import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  effect,
  EffectRef,
  OnInit,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  RolesEnums,
  STRATEGIC_PLAN_STAGES,
} from '../../../../Core/utilities/consts';
import { AuthService } from '../../../auth/services/auth.service';
import { StrategicPlanService } from '../../services/strategic-plan.service';
import { BranchFilterComponent } from '../../../../shared/components/branch-filter/branch-filter.component';
import { YearFilterComponent } from '../../../../shared/components/year-filter/year-filter.component';
import { StrategicPlansTableComponent } from '../../components/strategic-plans-table/strategic-plans-table.component';
import { StrategicPlansFormComponent } from '../../components/strategic-plans-form/strategic-plans-form.component';
import { getUserInfo } from '../../../../Core/utilities/utils';
import { StagesHeaderComponent } from '../../../../shared/components/stages-header/stages-header.component';
import { StagesNavigationService } from '../../services/stages-navigation.service';
import { PageTitleService } from '../../../page-titles/services/page-title.service';

@Component({
  selector: 'app-strategic-plan-home',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    YearFilterComponent,
    BranchFilterComponent,
    RouterLink,
    StrategicPlansTableComponent,
    StrategicPlansFormComponent,
    StagesHeaderComponent,
  ],
  templateUrl: './strategic-plan-home.component.html',
  styleUrl: './strategic-plan-home.component.css',
})
export class StrategicPlanHomeComponent implements OnInit {
  @ViewChild(StrategicPlansTableComponent)
  planTableComponent!: StrategicPlansTableComponent;

  stageTitle = 'الخطة الاستراتيجية';
  stageDescription = 'وصف الخطة الاستراتيجية';

  // Inject the stages navigation service
  private stagesNavigationService = inject(StagesNavigationService);
  private pageTitleService = inject(PageTitleService);

  // Define signals before using them in the constructor
  isHighManagementRole = signal(false);
  isAdmin = signal(false);
  isLoading = signal(true);

  private roleEffect: EffectRef;

  constructor(
    private readonly strategicPlanService: StrategicPlanService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
    private route: ActivatedRoute
  ) {
    // Store the effect reference to be able to clean it up later if needed
    this.roleEffect = effect(
      () => {
        // Read the current role value from auth service
        const isHighManagement = this.authService.isRole(
          RolesEnums.HighManagement
        );
        const isAdminRole = this.authService.allowInRoles([
          RolesEnums.HighManagement,
          RolesEnums.RegionManager,
        ]);

        // Update UI with separate statements outside the effect
        this.updateRoleSignals(isHighManagement, isAdminRole);
      },
      { allowSignalWrites: true }
    ); // Enable signal writes in this effect
  }

  // Method to update signals (can be called from the effect)
  private updateRoleSignals(isHighManagement: boolean, isAdmin: boolean): void {
    this.isHighManagementRole.set(isHighManagement);
    this.isAdmin.set(isAdmin);
  }

  form: FormGroup = new FormGroup({
    Name: new FormControl(null),
    employeeId: new FormControl(null),
    unitsId: new FormControl(null),
  });

  isCreatePopupVisible = false;
  isActionPopupVisible = false;
  isSuccessPopupVisible = false;

  currentStrategicPlan: any = [];
  totalPages = 0;

  userInfo = getUserInfo();
  userRole = this.userInfo['role'];
  unitsId = this.userInfo['unitId'];

  urlSegments = this.router.url.split('/');
  planId = Number(this.urlSegments[this.urlSegments.length - 2]);

  // In parent component
  isFormVisible = false;
  planToEdit: any = null;

  selectedYear: string | null = null;
  selectedUnit: string | null = null;

  showCreateForm() {
    this.isFormVisible = true;
  }

  showEditForm(plan: any) {
    this.planToEdit = plan;
    this.isFormVisible = true;
  }

  handleFormClose() {
    this.isFormVisible = false;
    this.planToEdit = null;
  }

  handleFormSubmit() {
    if (this.planToEdit) {
      // Handle edit
    } else {
      // Handle create
    }
    this.onFormSubmitComplete();
  }

  onFormSubmitComplete() {
    this.updateCurrentPlan();
  }

  showCreatePopup(): void {
    this.isFormVisible = true;
  }

  toggleActionPopup(): void {
    this.isActionPopupVisible = !this.isActionPopupVisible;
  }

  closeCreatePopup(): void {
    this.isCreatePopupVisible = false;
  }

  closeSuccessPopup(): void {
    this.isSuccessPopupVisible = false;
    window.location.reload();
  }

  close(): void {
    this.isCreatePopupVisible = false;
  }

  private updateCurrentPlan(): void {
    this.isLoading.set(true);

    const params: any = {};
    if (this.selectedYear) params['year'] = this.selectedYear;
    if (this.selectedUnit) params['unit'] = this.selectedUnit;

    this.strategicPlanService.getCurrantStrategicPlan(params).subscribe({
      next: (res) => {
        // Store the full response
        this.currentStrategicPlan = res;

        // Calculate total pages from metadata
        this.totalPages = Math.ceil(res.metadata.total / res.metadata.perPage);

        // Update plan stages in the table component if it exists
        if (this.planTableComponent) {
          this.planTableComponent.updatePlanStages();
        }

        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading strategic plans:', err);
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  private initializeForm(): void {
    this.form.reset();
    const { unitId, userId } = getUserInfo();

    this.form.patchValue({
      employeeId: userId,
      unitsId: unitId,
    });
  }

  showPopup(): void {
    this.isCreatePopupVisible = true;
  }

  navigateToInProgressStage(planId: number): void {
    if (this.isLoading()) {
      return;
    }

    // Check if currentStrategicPlan is an array or has a data property
    const plansArray = Array.isArray(this.currentStrategicPlan)
      ? this.currentStrategicPlan
      : this.currentStrategicPlan?.data || [];

    // Get the plan from the current plans list
    const plan = plansArray.find((p: any) => p.id === planId);

    if (plan) {
      // Use the stages navigation service to navigate to the in-progress stage
      this.stagesNavigationService.navigateToInProgressStage(
        planId.toString(),
        plan
      );
    }
  }

  getInProgressStepDetails() {
    return STRATEGIC_PLAN_STAGES.Analysis;
  }

  onPlanUpdated(): void {
    this.updateCurrentPlan();
  }

  onYearChange(year: string | null) {
    this.selectedYear = year;
    this.updateCurrentPlan();
  }

  onUnitChange(unit: string) {
    this.selectedUnit = unit;
    this.updateCurrentPlan();
  }

  onPageChange(page: number) {
    const params: any = {
      page: page,
      year: this.selectedYear,
      unit: this.selectedUnit,
    };
    this.strategicPlanService.getCurrantStrategicPlan(params).subscribe({
      next: (res) => {
        this.currentStrategicPlan = res;
        this.cdr.detectChanges();
      },
    });
  }

  ngOnInit(): void {
    this.pageTitleService.getAllTitles().subscribe({
      next: (res) => {
        const t = res.titles.find(t => t.key === 'plans_title');
        if (t) this.stageTitle = t.currentValue;
        const d = res.titles.find(t => t.key === 'plans_description');
        if (d) this.stageDescription = d.currentValue;
      },
    });
    this.initializeForm();

    this.route.queryParams.subscribe((params) => {
      this.selectedYear = params['year'] || null;
      this.selectedUnit = params['unit'] || null;
      this.updateCurrentPlan();
    });

    this.cdr.detectChanges();
  }
}
