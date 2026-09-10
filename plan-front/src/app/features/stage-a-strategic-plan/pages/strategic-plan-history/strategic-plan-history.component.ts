import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  effect,
  EffectRef,
  OnInit,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { YearFilterComponent } from '../../../../shared/components/year-filter/year-filter.component';
import { BranchFilterComponent } from '../../../../shared/components/branch-filter/branch-filter.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { StrategicPlanService } from '../../services/strategic-plan.service';
import { AuthService } from '../../../auth/services/auth.service';
import {
  RolesEnums,
  STRATEGIC_PLAN_STAGES,
} from '../../../../Core/utilities/consts';
import { StrategicPlansTableComponent } from '../../components/strategic-plans-table/strategic-plans-table.component';
import { getUserInfo } from '../../../../Core/utilities/utils';

@Component({
  selector: 'app-strategic-plan-history',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    YearFilterComponent,
    BranchFilterComponent,
    RouterLink,
    RouterLinkActive,
    PaginationComponent,
    StrategicPlansTableComponent,
  ],
  templateUrl: './strategic-plan-history.component.html',
  styleUrl: './strategic-plan-history.component.css',
})
export class StrategicPlanHistoryComponent implements OnInit, OnDestroy {
  @ViewChild(StrategicPlansTableComponent)
  planTableComponent!: StrategicPlansTableComponent;

  // Define signals before using them in the constructor
  isHighManagementRole = signal(false);
  isAdmin = signal(false);

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
    const params: any = {};
    if (this.selectedYear) params['year'] = this.selectedYear;
    if (this.selectedUnit) params['unit'] = this.selectedUnit;

    this.strategicPlanService.getCurrantStrategicPlan(params, 'old').subscribe({
      next: (res) => {
        this.currentStrategicPlan = res;
        this.totalPages = Math.ceil(res.metadata.total / res.metadata.perPage);
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
    const inProgressStep = this.getInProgressStepDetails();
    this.router.navigate([`/plans/${planId}/${inProgressStep.path}`]);
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
    };
    if (this.selectedYear) params['year'] = this.selectedYear;
    if (this.selectedUnit) params['unit'] = this.selectedUnit;

    this.strategicPlanService.getCurrantStrategicPlan(params, 'old').subscribe({
      next: (res) => {
        this.currentStrategicPlan = res;
        this.cdr.detectChanges();
      },
    });
  }

  ngOnInit(): void {
    this.initializeForm();

    this.route.queryParams.subscribe((params) => {
      this.selectedYear = params['year'] || null;
      this.selectedUnit = params['unit'] || null;
      this.updateCurrentPlan();
    });

    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    // Clean up the effect when component is destroyed
    if (this.roleEffect) {
      this.roleEffect.destroy();
    }
  }
}
