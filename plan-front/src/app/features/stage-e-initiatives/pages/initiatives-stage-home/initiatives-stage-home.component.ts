import { PdfService } from './../../../../pdf.service';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { SharedDataService } from '../../../../Core/Service/shared-data.service';
import {
  ApprovalStatusEnum,
  PendingStatuses,
  RejectionStatuses,
  ReturnedStatuses,
  RolesEnums,
} from '../../../../Core/utilities/consts';
import { PopupComponent } from '../../../../shared/components/popup/popup.component';
import { AuthService } from '../../../auth/services/auth.service';
import { PlanStatusService } from '../../../stage-a-strategic-plan/services/PlanStatus.service';
import { InitiativesItemFormComponent } from '../../components/initiatives-item-form/initiatives-item-form.component';
import { InitiativesItemViewModalComponent } from '../../components/initiatives-item-view-modal/initiatives-item-view-modal.component';
import { ObjectivesFormComponent } from '../../components/objectives-form/objectives-form.component';
import { InitiativesService } from '../../services/initiatives.service';
import { InitiativesStatusService } from '../../services/initiatives-status.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ApproveAllService } from '../../../../approve-all.service';
import { PageTitleService } from '../../../page-titles/services/page-title.service';
import { PermissionsService } from '../../../../Core/Service/permissions.service';

@Component({
  selector: 'app-initiatives-stage-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    ObjectivesFormComponent,
    InitiativesItemFormComponent,
    InitiativesItemViewModalComponent,
    PopupComponent,
  ],
  templateUrl: './initiatives-stage-home.component.html',
  styleUrl: './initiatives-stage-home.component.css',
})
export class InitiativesStageHomeComponent implements OnInit {
  private permissionsService = inject(PermissionsService);
  // Make enum available in template
  ApprovalStatusEnum = ApprovalStatusEnum;

  private pageTitleService = inject(PageTitleService);
  titlesMap = signal<Record<string, string>>({});
  planId = '';
  goalId = signal<any>(null);
  isSubmit = false;
  isSubmitOnce = signal<boolean>(false);
  showForm = signal(false);
  initiatives = signal<any[]>([]);
  filteredInitiatives = signal<any[]>([]);
  isAllowToAccept = signal(false);
  isAdmin = false;
  showInitiativeSubmissionBtn = false;
  isInitiativesApproved = false;
  isSuccessPopupVisible = false;
  isProjectsStageActive = false;
  currentPage = 1;
  totalPages: any = null;

  // Plan status signal
  planInitiativeStatus: WritableSignal<ApprovalStatusEnum> = signal(
    ApprovalStatusEnum.Pending
  );

  // Filter properties
  filterStatus = '';
  filterUnit = '';
  searchTerm = '';
  availableStatuses = signal<string[]>([]);
  availableUnits = signal<string[]>([]);

  // Modal properties
  showFormModal = signal(false);
  isEditing = signal(false);
  editingInitiativeId = signal<number | null>(null);
  viewingInitiative = signal<any>(null);
  showDeleteModal = false;
  deletingInitiative: any = null;

  // Cache for initiative validation
  private initiativeValidationCache = new Map<
    string,
    { canApprove: boolean; message: string | null; timestamp: number }
  >();
  private readonly CACHE_DURATION = 5000; // 5 seconds cache

  // Reactive computed property for add button state
  buttonState = computed(() => {
    const goalValue = this.goalId();
    const canAdd = this.canAddItems();
    const isValidGoal = goalValue && goalValue !== 0;

    return {
      goalValue,
      canAdd,
      isValidGoal,
      shouldEnable: canAdd && isValidGoal,
    };
  });

  private planStatusService = inject(PlanStatusService);
  public initiativesStatusService = inject(InitiativesStatusService);

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private initiativesService: InitiativesService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private sharedDataService: SharedDataService,
    private PdfService: PdfService,
    private app:ApproveAllService
  ) {
    // Set up reactive effects for button visibility
    effect(() => {
      this.showInitiativeSubmissionBtn =
        this.initiativesStatusService.canShowSubmitButton();
      this.isInitiativesApproved =
        this.initiativesStatusService.isInitiativesApproved();
    });
  }

  t(key: string, fallback: string): string {
    return this.titlesMap()[key] || fallback;
  }

  ngOnInit() {
    this.pageTitleService.getAllTitles().subscribe({
      next: (res) => {
        const map: Record<string, string> = {};
        res.titles.forEach(t => map[t.key] = t.currentValue);
        this.titlesMap.set(map);
      },
    });
    this.route.params.subscribe((params) => {
      this.planId = params['planId'];

      if (this.planId) {
        this.sharedDataService.setPlanId(this.planId);
        this.initializeData();
      } else {
        console.error('No planId found in route parameters');
      }
    });

    this.isAdmin = this.authService.allowInRoles([
      RolesEnums.HighManagement,
      RolesEnums.RegionManager,
      RolesEnums.UnitManager,
    ]);
  }

  private initializeData(): void {
    if (!this.planId) {
      console.error('Plan ID not available');
      return;
    }

    // First, get the plan status
    this.getPlanStatus();

    // Also check projects stage status
    this.checkProjectsStageStatus();
  }

  getPlanStatus() {
    if (!this.planId) {
      console.error('Cannot get plan status: Plan ID not available');
      return;
    }
    console.log(this.planId);
    this.initiativesService.getInitiativeStatus(this.planId).subscribe({
      next: (response) => {
        // Set the plan initiative status from the response
        this.planInitiativeStatus.set(response.status as ApprovalStatusEnum);

        // Update the status service
        this.initiativesStatusService.setStageStatus(
          response.status as ApprovalStatusEnum
        );

        // Now load the initiatives data
        this.loadInitiatives();

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching plan initiatives status:', error);

        // If status fetch fails, still try to load initiatives with default status
        this.planInitiativeStatus.set(ApprovalStatusEnum.Pending);
        this.initiativesStatusService.setStageStatus(
          ApprovalStatusEnum.Pending
        );
        this.loadInitiatives();
      },
    });
  }

  loadInitiatives() {
    if (!this.planId) {
      console.error('Cannot load initiatives: Plan ID not available');
      return;
    }

    this.initiativesService.getInitiatives(this.planId).subscribe({
      next: (response) => {
        // Set the initiatives data
        this.initiatives.set(response || []);

        // Update the status service with initiatives data
        this.initiativesStatusService.setInitiativesList(response || []);
        this.initiativesStatusService.setDataLoaded(true);

        // Extract filter options and apply initial filters
        this.extractFilterOptions();
        this.applyFilters();

        // Set isSubmitOnce based on whether initiatives exist
        if (response.data?.length) {
          this.isSubmitOnce.set(true);
        } else {
          this.isSubmitOnce.set(false);
        }

        // Clear validation cache since data has been updated
        this.clearValidationCache();

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading initiatives:', error);

        // Set empty data on error
        this.initiatives.set([]);
        this.initiativesStatusService.setInitiativesList([]);
        this.initiativesStatusService.setDataLoaded(true);
        this.isSubmitOnce.set(false);

        this.cdr.detectChanges();
      },
    });
  }

  checkProjectsStageStatus() {
    if (!this.planId) return;

    this.planStatusService.getPlanStatus(this.planId).subscribe({
      next: (planStatus) => {
        this.isProjectsStageActive = planStatus.projectsStage;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching plan status:', error);
        this.isProjectsStageActive = false;
        this.cdr.detectChanges();
      },
    });
  }

  handleObjectiveSelection(event: string) {
    const goalIdValue = Number(event);

    this.goalId.set(goalIdValue);
    this.showForm.set(false);

    // Trigger change detection to update button state immediately
    this.cdr.detectChanges();
  }

  setIsSubmitOnce(event: boolean) {
    if (!this.isSubmitOnce()) {
      this.isSubmitOnce.set(event);
    }
    this.showForm.set(false);
    this.loadInitiatives();
  }

  handleshowForm() {
    // Ensure an objective is selected before showing the form
    if (!this.goalId() || this.goalId() === 0) {
      alert('يرجى اختيار هدف أولاً قبل إضافة مبادرة');
      return;
    }
    this.showForm.set(true);
  }

  /**
   * Approve the whole initiatives stage
   */
  handleApproveInitiativesStep(): void {
    if (this.planId) {
      this.initiativesService.approveInitiativeStage(this.planId).subscribe({
        next: () => {
          this.isSuccessPopupVisible = true;
          // Refresh plan status to update button visibility
          this.getPlanStatus();
          // Also check projects stage status to show "To Projects" button
          this.checkProjectsStageStatus();
        },
        error: (error) => {
          console.error('Error approving initiatives stage:', error);
        },
      });
    }
  }

  /**
   * Get descriptive text for the submission button based on user role
   */
  getSubmissionButtonText(): string {
    const userRole = this.authService.getUserRole();

    if (userRole === RolesEnums.UnitManager) {
      return 'إرسال إلى مدير المنطقة';
    } else if (userRole === RolesEnums.RegionManager) {
      return 'إرسال إلى الإدارة العليا';
    } else if (userRole === RolesEnums.HighManagement) {
      return 'الموافقة النهائية';
    }

    return 'تأكيد';
  }

  /**
   * Get current stage status hint text
   */
  getCurrentStageHint(): string {
    const stageStatus = this.planInitiativeStatus();

    switch (stageStatus) {
      case ApprovalStatusEnum.Pending:
        return 'المرحلة الحالية: في انتظار موافقة مدير الوحدة';
      case ApprovalStatusEnum.ApprovedByUnitManager:
      case ApprovalStatusEnum.ApprovedByUnitManagerPartially:
        return 'المرحلة الحالية: في انتظار موافقة مدير المنطقة';
      case ApprovalStatusEnum.ApprovedByRegionManager:
      case ApprovalStatusEnum.ApprovedByRegionManagerPartially:
        return 'المرحلة الحالية: في انتظار موافقة الإدارة العليا';
      case ApprovalStatusEnum.ApprovedByHighManagement:
        return 'تم اعتماد المرحلة بالكامل';
      case ApprovalStatusEnum.RejectedByUnitManager:
        return 'المرحلة: مرفوضة من مدير الوحدة';
      case ApprovalStatusEnum.RejectedByRegionManager:
        return 'المرحلة: مرفوضة من مدير المنطقة';
      case ApprovalStatusEnum.RejectedByHighManagement:
        return 'المرحلة: مرفوضة من الإدارة العليا';
      case ApprovalStatusEnum.ReturnedByUnitManager:
        return 'المرحلة: مُرجعة من مدير الوحدة';
      case ApprovalStatusEnum.ReturnedByRegionManager:
        return 'المرحلة: مُرجعة من مدير المنطقة';
      case ApprovalStatusEnum.ReturnedByHighManagement:
        return 'المرحلة: مُرجعة من الإدارة العليا';
      default:
        return 'المرحلة الحالية: غير محددة';
    }
  }

  /**
   * Apply filters to initiatives list
   */
  applyFilters(): void {
    const initiatives = this.initiatives();
    let filtered = [...initiatives];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((initiative) => {
        const name = (
          initiative.name?.value ||
          initiative.name ||
          ''
        ).toLowerCase();
        const goalName = (initiative.goalName || '').toLowerCase();
        const unitName = (initiative.unitName || '').toLowerCase();

        return (
          name.includes(searchLower) ||
          goalName.includes(searchLower) ||
          unitName.includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (this.filterStatus) {
      filtered = filtered.filter(
        (initiative) => initiative.status === this.filterStatus
      );
    }

    // Apply unit filter
    if (this.filterUnit) {
      filtered = filtered.filter(
        (initiative) => initiative.unitName === this.filterUnit
      );
    }

    this.filteredInitiatives.set(filtered);
  }

  /**
   * Extract available filter options from initiatives data
   */
  private extractFilterOptions(): void {
    const initiatives = this.initiatives();

    // Set all possible statuses
    const statuses = [
      ApprovalStatusEnum.Pending,
      ApprovalStatusEnum.SavedAsDraft,
      ApprovalStatusEnum.ApprovedByUnitManager,
      ApprovalStatusEnum.ApprovedByUnitManagerPartially,
      ApprovalStatusEnum.ReturnedByUnitManager,
      ApprovalStatusEnum.RejectedByUnitManager,
      ApprovalStatusEnum.ApprovedByRegionManager,
      ApprovalStatusEnum.ApprovedByRegionManagerPartially,
      ApprovalStatusEnum.ReturnedByRegionManager,
      ApprovalStatusEnum.RejectedByRegionManager,
      ApprovalStatusEnum.ApprovedByHighManagement,
      ApprovalStatusEnum.ApprovedByHighManagementPartially,
      ApprovalStatusEnum.ReturnedByHighManagement,
      ApprovalStatusEnum.RejectedByHighManagement,
    ];
    this.availableStatuses.set(statuses);

    // Extract unique unit names
    const units = [
      ...new Set(
        initiatives.map((initiative) => initiative.unitName).filter(Boolean)
      ),
    ];
    this.availableUnits.set(units);
  }

  /**
   * Handle status filter change
   */
  onStatusFilterChange(status: string): void {
    this.filterStatus = status;
    this.resetPagination();
    this.applyFilters();
  }

  /**
   * Handle unit filter change
   */
  onUnitFilterChange(unit: string): void {
    this.filterUnit = unit;
    this.applyFilters();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.filterStatus = '';
    this.filterUnit = '';
    this.resetPagination();
    this.applyFilters();
  }

  /**
   * Get user-friendly status name for display
   */
  getStatusDisplayName(status: string): string {
    switch (status) {
      case ApprovalStatusEnum.Pending:
        return 'في انتظار الموافقة';
      case ApprovalStatusEnum.ApprovedByUnitManager:
        return 'موافق عليه من مدير الوحدة';
      case ApprovalStatusEnum.ApprovedByUnitManagerPartially:
        return 'موافق عليه من مدير الوحدة';
      case ApprovalStatusEnum.ApprovedByRegionManager:
        return 'موافق عليه من مدير المنطقة';
      case ApprovalStatusEnum.ApprovedByRegionManagerPartially:
        return 'موافق عليه من مدير المنطقة';
      case ApprovalStatusEnum.ApprovedByHighManagement:
        return 'موافق عليه من الإدارة العليا';
      case ApprovalStatusEnum.ApprovedByHighManagementPartially:
        return 'موافق عليه من الإدارة العليا';
      case ApprovalStatusEnum.RejectedByUnitManager:
        return 'مرفوض من مدير الوحدة';
      case ApprovalStatusEnum.RejectedByRegionManager:
        return 'مرفوض من مدير المنطقة';
      case ApprovalStatusEnum.RejectedByHighManagement:
        return 'مرفوض من الإدارة العليا';
      case ApprovalStatusEnum.ReturnedByUnitManager:
        return 'مُرجع من مدير الوحدة';
      case ApprovalStatusEnum.ReturnedByRegionManager:
        return 'مُرجع من مدير المنطقة';
      case ApprovalStatusEnum.ReturnedByHighManagement:
        return 'مُرجع من الإدارة العليا';
      case ApprovalStatusEnum.SavedAsDraft:
        return 'مسودة';
      default:
        return status;
    }
  }

  /**
   * Get appropriate CSS class for status badge based on current user role
   */
  getStatusBadgeClass(status: string): string {
    if (!status) return 'bg-secondary';
    if (status === ApprovalStatusEnum.SavedAsDraft) return 'bg-secondary';

    const userRole = this.authService.getUserRole();

    // For Unit Managers
    if (userRole === RolesEnums.UnitManager) {
      if (status === ApprovalStatusEnum.Pending) {
        return 'bg-warning'; // Needs their action
      }
      if (status.includes('ApprovedByUnitManager')) {
        return 'bg-success'; // They approved it
      }
      if (status.includes('RejectedByUnitManager')) {
        return 'bg-danger'; // They rejected it
      }
      if (status.includes('ReturnedByUnitManager')) {
        return 'bg-secondary'; // They returned it
      }
    }

    // For Region Managers
    if (userRole === RolesEnums.RegionManager) {
      if (status.includes('ApprovedByUnitManager')) {
        return 'bg-warning'; // Needs their action (approved by previous role)
      }
      if (status.includes('ApprovedByRegionManager')) {
        return 'bg-success'; // They approved it
      }
      if (status.includes('RejectedByRegionManager')) {
        return 'bg-danger'; // They rejected it
      }
      if (status.includes('ReturnedByRegionManager')) {
        return 'bg-secondary'; // They returned it
      }
      if (status === ApprovalStatusEnum.Pending) {
        return 'bg-light text-dark'; // Not ready for them yet
      }
    }

    // For High Management
    if (userRole === RolesEnums.HighManagement) {
      if (status.includes('ApprovedByRegionManager')) {
        return 'bg-warning'; // Needs their action (approved by previous role)
      }
      if (status.includes('ApprovedByHighManagement')) {
        return 'bg-success'; // They approved it
      }
      if (status.includes('RejectedByHighManagement')) {
        return 'bg-danger'; // They rejected it
      }
      if (status.includes('ReturnedByHighManagement')) {
        return 'bg-secondary'; // They returned it
      }
      if (
        status === ApprovalStatusEnum.Pending ||
        status.includes('ApprovedByUnitManager')
      ) {
        return 'bg-light text-dark'; // Not ready for them yet
      }
    }

    // Default fallback for other roles or statuses
    if (status.includes('Approved')) {
      return 'bg-success';
    }
    if (status.includes('Rejected')) {
      return 'bg-danger';
    }
    if (status.includes('Returned')) {
      return 'bg-secondary';
    }
    if (status.includes('Pending')) {
      return 'bg-warning';
    }

    return 'bg-secondary';
  }

  /**
   * Check if the current user can add new initiatives
   */
  canAddItems(): boolean {
    const userRole = this.authService.getUserRole();
    return userRole === RolesEnums.UnitEmployee;
  }

  /**
   * Calculate whether the submission button should be visible
   */
  calculateSubmissionButtonVisibility() {
    const userRole = this.authService.getUserRole();
    const stageStatus = this.planInitiativeStatus();

    console.log('Calculating submission button visibility:', {
      userRole,
      stageStatus,
      initiativesCount: this.initiatives().length,
    });

    // First check if user has the right role for current stage status
    const canApproveStage = this.canApproveStageBasedOnRole();

    // Then check if all initiatives have been acted upon
    const allActedUpon = this.allInitiativesActedUpon();

    // Show button only if both conditions are met
    this.showInitiativeSubmissionBtn = canApproveStage && allActedUpon;
  }

  /**
   * Check if the current user can approve the stage based on their role and current stage status
   */
  canApproveStageBasedOnRole(): boolean {
    const userRole = this.authService.getUserRole();
    const stageStatus = this.planInitiativeStatus();

    // Unit Manager can approve when stage is Pending
    if (userRole === RolesEnums.UnitManager) {
      return stageStatus === ApprovalStatusEnum.Pending;
    }

    // Region Manager can approve when stage is approved (fully or partially) by Unit Manager
    if (userRole === RolesEnums.RegionManager) {
      return (
        stageStatus === ApprovalStatusEnum.ApprovedByUnitManager ||
        stageStatus === ApprovalStatusEnum.ApprovedByUnitManagerPartially
      );
    }

    // High Management can approve when stage is approved (fully or partially) by Region Manager
    if (userRole === RolesEnums.HighManagement) {
      return (
        stageStatus === ApprovalStatusEnum.ApprovedByRegionManager ||
        stageStatus === ApprovalStatusEnum.ApprovedByRegionManagerPartially
      );
    }

    return false;
  }

  /**
   * Check if all initiatives and their items have been acted upon by the current manager
   */
  allInitiativesActedUpon(): boolean {
    const userRole = this.authService.getUserRole();
    const initiatives = this.initiatives();

    if (!initiatives || initiatives.length === 0) {
      return false; // No initiatives to act upon
    }

    // Check each initiative (initiative level + items level)
    const allActedUpon = initiatives.every((initiative) => {
      // 1. Check initiative-level approval
      const initiativeActedUpon = this.isInitiativeActedUponByRole(
        initiative.status,
        userRole
      );

      // 2. Check initiative items approval
      const itemsActedUpon = this.areInitiativeItemsActedUponByRole(
        initiative,
        userRole
      );

      const initiativeComplete = initiativeActedUpon && itemsActedUpon;

      return initiativeComplete;
    });

    return allActedUpon;
  }

  /**
   * Check if an initiative has been acted upon by the specified role
   */
  private isInitiativeActedUponByRole(
    initiativeStatus: string,
    userRole: string | null
  ): boolean {
    if (!userRole) return false;

    // For Unit Managers: Initiative should be approved (fully or partially), rejected, or returned by Unit Manager
    if (userRole === RolesEnums.UnitManager) {
      return (
        initiativeStatus === ApprovalStatusEnum.ApprovedByUnitManager ||
        initiativeStatus ===
          ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
        initiativeStatus === ApprovalStatusEnum.RejectedByUnitManager ||
        initiativeStatus === ApprovalStatusEnum.ReturnedByUnitManager
      );
    }

    // For Region Managers: Initiative should be approved (fully or partially), rejected, or returned by Region Manager
    if (userRole === RolesEnums.RegionManager) {
      return (
        initiativeStatus === ApprovalStatusEnum.ApprovedByRegionManager ||
        initiativeStatus ===
          ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
        initiativeStatus === ApprovalStatusEnum.RejectedByRegionManager ||
        initiativeStatus === ApprovalStatusEnum.ReturnedByRegionManager
      );
    }

    // For High Management: Initiative should be approved (fully or partially), rejected, or returned by High Management
    if (userRole === RolesEnums.HighManagement) {
      return (
        initiativeStatus === ApprovalStatusEnum.ApprovedByHighManagement ||
        initiativeStatus ===
          ApprovalStatusEnum.ApprovedByHighManagementPartially ||
        initiativeStatus === ApprovalStatusEnum.RejectedByHighManagement ||
        initiativeStatus === ApprovalStatusEnum.ReturnedByHighManagement
      );
    }

    return false;
  }

  /**
   * Check if all items within an initiative have been acted upon by the specified role
   */
  private areInitiativeItemsActedUponByRole(
    initiative: any,
    userRole: string | null
  ): boolean {
    if (!userRole) return false;

    // Helper function to check if an item has been acted upon by the role
    const isItemActedUpon = (item: any): boolean => {
      if (!item || !item.status) return false;

      if (userRole === RolesEnums.UnitManager) {
        return (
          item.status === ApprovalStatusEnum.ApprovedByUnitManager ||
          item.status === ApprovalStatusEnum.ApprovedByUnitManagerPartially ||
          item.status === ApprovalStatusEnum.RejectedByUnitManager ||
          item.status === ApprovalStatusEnum.ReturnedByUnitManager
        );
      }

      if (userRole === RolesEnums.RegionManager) {
        return (
          item.status === ApprovalStatusEnum.ApprovedByRegionManager ||
          item.status === ApprovalStatusEnum.ApprovedByRegionManagerPartially ||
          item.status === ApprovalStatusEnum.RejectedByRegionManager ||
          item.status === ApprovalStatusEnum.ReturnedByRegionManager
        );
      }

      if (userRole === RolesEnums.HighManagement) {
        return (
          item.status === ApprovalStatusEnum.ApprovedByHighManagement ||
          item.status ===
            ApprovalStatusEnum.ApprovedByHighManagementPartially ||
          item.status === ApprovalStatusEnum.RejectedByHighManagement ||
          item.status === ApprovalStatusEnum.ReturnedByHighManagement
        );
      }

      return false;
    };

    // Check if this is list data (flat structure) or detail data (nested structure)
    if (
      initiative.name &&
      typeof initiative.name === 'object' &&
      initiative.name.status !== undefined
    ) {
      // This is detailed data structure (from getInitiativeById)

      // Check each required item (name, KPIs, and initiative items)
      const nameActedUpon = isItemActedUpon(initiative.name);

      // Check all KPIs
      const kpisActedUpon =
        initiative.initiativeKPIs?.every((kpi: any) => isItemActedUpon(kpi)) ??
        true; // If no KPIs, consider as acted upon

      // Check all initiative items
      const itemsActedUpon =
        initiative.initiativeItem?.every((item: any) =>
          isItemActedUpon(item)
        ) ?? true; // If no items, consider as acted upon

      const allItemsActedUpon =
        nameActedUpon && kpisActedUpon && itemsActedUpon;

      // Only log if debugging is enabled or if there's an issue
      if (!allItemsActedUpon) {
        console.log(`Initiative ${initiative.id} items incomplete:`, {
          name: {
            value: initiative.name?.value,
            status: initiative.name?.status,
            actedUpon: nameActedUpon,
          },
          kpisActedUpon,
          itemsActedUpon,
          userRole,
          allItemsActedUpon,
        });
      }

      return allItemsActedUpon;
    } else {
      // This is list data structure (from getInitiatives) - only has initiative-level status
      // For list data, we can only check the initiative status, not individual items

      // For list data, consider it acted upon if the initiative itself has been acted upon
      return this.isInitiativeActedUponByRole(initiative.status, userRole);
    }
  }

  /**
   * Clear validation cache (call after data updates)
   */
  private clearValidationCache(): void {
    this.initiativeValidationCache.clear();
  }

  closeSuccessPopup() {
    this.isSuccessPopupVisible = false;
  }

  /**
   * Modal control methods
   */
  openAddModal(): void {
    this.isEditing.set(false);
    this.editingInitiativeId.set(null);
    this.showFormModal.set(true);
  }

  closeModal(): void {
    this.showFormModal.set(false);
    this.isEditing.set(false);
    this.editingInitiativeId.set(null);
    this.loadInitiatives(); // Refresh data
  }

  /**
   * Initiative action methods
   */
  viewInitiative(initiative: any): void {
    if (initiative && initiative.id) {
      // Fetch detailed data from API instead of using table data
      this.initiativesService.getInitiativeById(initiative.id).subscribe({
        next: (detailedInitiative) => {
          this.viewingInitiative.set(detailedInitiative);
        },
        error: (error) => {
          console.error('Error fetching initiative details:', error);
          // Fallback to table data if API fails
          this.viewingInitiative.set(initiative);
        },
      });
    } else {
      console.error('Invalid initiative data for viewing:', initiative);
    }
  }

  closeViewModal(): void {
    this.viewingInitiative.set(null);
  }

  editInitiative(initiative: any): void {
    this.isEditing.set(true);
    this.editingInitiativeId.set(initiative.id);
    this.showFormModal.set(true);
  }

  deleteInitiative(initiative: any): void {
    this.deletingInitiative = initiative;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.deletingInitiative) {
      this.initiativesService
        .deleteInitiative(this.deletingInitiative.id.toString())
        .subscribe({
          next: () => {
            this.loadInitiatives();
            this.cancelDelete();
          },
          error: (error) => {
            console.error('Error deleting initiative:', error);
            this.cancelDelete();
          },
        });
    }
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.deletingInitiative = null;
  }

  /**
   * Permission check methods
   */
  canEditInitiative(initiative: any): boolean {
    const userRole = this.authService.getUserRole();

    // Only Unit employees can edit initiatives
    if (userRole !== RolesEnums.UnitEmployee) {
      return false;
    }

    // Editable while the initiative is not yet approved at any level.
    // Once approved it is locked; a reject/return reopens it until final approval.
    const isDraft = initiative.status === ApprovalStatusEnum.SavedAsDraft;
    const isPending = PendingStatuses.includes(initiative.status);
    const isReturned = ReturnedStatuses.includes(initiative.status);
    const isRejected = RejectionStatuses.includes(initiative.status);

    return isDraft || isPending || isReturned || isRejected;
  }

  canDeleteInitiative(initiative: any): boolean {
    return this.permissionsService.canDeleteItem('Initiative', initiative);
  }

  /**
   * Form submission handler
   */
  handleFormSubmit(success: boolean): void {
    if (success) {
      this.isSubmitOnce.set(true);
      this.closeModal();
    }
  }

  /**
   * Handle popup option selection like in objectives table
   */
  onSelectedOption(event: Record<string, any>): void {
    const initiative = this.initiatives().find(
      (init) => init.id === event['id']
    );

    switch (event['type']) {
      case 'view':
        this.viewInitiative(initiative);
        break;
      case 'edit':
        this.editInitiative(initiative);
        break;
      case 'delete':
        this.deleteInitiative(initiative);
        break;
    }
  }

  /**
   * Handle data updates from the view modal
   */
  onInitiativeDataUpdated(): void {
    // Refresh the initiatives list to reflect changes in the table
    this.loadInitiatives();
  }

  /**
   * Handle search term change
   */
  onSearchChange(): void {
    this.resetPagination();
    this.applyFilters();
  }

  /**
   * Clear search term
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.resetPagination();
    this.applyFilters();
  }

  /**
   * Reset pagination when filters change
   */
  private resetPagination(): void {
    this.currentPage = 1;
  }
 generatePDF(): void {
  const planId = Number(this.route.snapshot.paramMap.get('planId'));

  if (!planId || isNaN(planId)) {
    console.error('planId غير موجود أو غير صحيح');
    return;
  }

  this.PdfService.getPdfforinit(planId).subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    },
    error: (err) => {
      console.error('حصل خطأ أثناء تحميل الـ PDF', err);
    }
  });
}

Approve(): void {
  const planId = Number(this.route.snapshot.paramMap.get('planId'));

  if (!planId || isNaN(planId)) {
    console.error('planId غير موجود أو غير صحيح');
    return;
  }

  this.app.ApproveInitiatives(planId).subscribe({
    next: () => {
      this.loadInitiatives();
      this.getPlanStatus();
    },
    error: (err) => {
      console.error('حصل خطأ أثناء الإرسال', err);
    }
  });
}

  
}
