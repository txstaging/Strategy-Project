import { PdfService } from './../../../../pdf.service';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PlanProjectsService } from '../../services/plan-projects.service';
import {
  RolesEnums,
  ApprovalStatusEnum,
  PendingStatuses,
  RejectionStatuses,
  ReturnedStatuses,
} from '../../../../Core/utilities/consts';
import { AuthService } from '../../../auth/services/auth.service';
import { PlanStatusService } from '../../../stage-a-strategic-plan/services/PlanStatus.service';
import { ProjectItemComponent } from '../../components/project-item/project-item.component';
import { ProjectViewModalComponent } from '../../components/project-view-modal/project-view-modal.component';
import { PopupComponent } from '../../../../shared/components/popup/popup.component';
import { SharedDataService } from '../../../../Core/Service/shared-data.service';
import { ProjectAddModalComponent } from '../../components/project-add-modal/project-add-modal.component';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ApproveAllService } from '../../../../approve-all.service';
import { PageTitleService } from '../../../page-titles/services/page-title.service';
import { PermissionsService } from '../../../../Core/Service/permissions.service';
import {
  approvalRank,
  canRoleActInStage,
  isPartialOf,
  isSentBack,
  roleRank,
} from '../../../../Core/utilities/approval-ladder';

@Component({
  selector: 'app-projects-stage-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    ProjectItemComponent,
    ProjectViewModalComponent,
    PopupComponent,
    ProjectAddModalComponent,
  ],
  templateUrl: './projects-stage-home.component.html',
  styleUrl: './projects-stage-home.component.css',
})
export class ProjectsStageHomeComponent implements OnInit {
  private permissionsService = inject(PermissionsService);
  // Make enum available in template
  ApprovalStatusEnum = ApprovalStatusEnum;

  private pageTitleService = inject(PageTitleService);
  titlesMap = signal<Record<string, string>>({});
  planId = signal<string>('');
  selectedPriority = 'أولوية أولى';
  showForm = false;
  projectForm!: FormGroup;
  projects = signal<any[]>([]);
  loading = signal<boolean>(false);

  filteredProjects = computed(() => {
    let filtered = this.projects();

    // Apply search filter
    if (this.searchTerm()) {
      const search = this.searchTerm().toLowerCase();
      filtered = filtered.filter(
        (project) =>
          (project.name?.value || project.name || '')
            .toLowerCase()
            .includes(search) ||
          (project.code?.value || project.code || '')
            .toLowerCase()
            .includes(search)
      );
    }

    // Apply status filter
    if (this.filterStatus()) {
      filtered = filtered.filter(
        (project) => project.status === this.filterStatus()
      );
    }

    // Apply unit filter
    if (this.filterUnit()) {
      filtered = filtered.filter(
        (project) => project.unitName === this.filterUnit()
      );
    }

    return filtered;
  });

  isAdmin = false;
  isProjectsApproved = signal<boolean>(false);
  showProjectsSubmissionBtn = computed(() => {
    return this.calculateSubmissionButtonVisibility();
  });
  isReportsStageActive = signal<boolean>(false);
  selectedInitiativeId: string | undefined;
  isSuccessPopupVisible = false;

  // Plan status signal
  planProjectStatus = signal(ApprovalStatusEnum.Pending);

  // Filter properties
  filterStatus = signal<string>('');
  filterUnit = signal<string>('');
  searchTerm = signal<string>('');
  availableStatuses = signal<string[]>([]);
  availableUnits = signal<string[]>([]);

  // Modal properties
  viewingProject = signal<any>(null);
  showDeleteModal = false;
  deletingProject: any = null;
  showAddModal = signal<boolean>(false);

  private planStatusService = inject(PlanStatusService);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private planProjectsService: PlanProjectsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private sharedDataService: SharedDataService,
    private PdfService:PdfService,
    private app:ApproveAllService
  ) {
    this.projectForm = this.fb.group({
      name: [''],
      priority: ['1'],
      duration: [''],
      beneficiaries: [''],
      supervisingAuthority: [''],
      weight: [''],
      code: [''],
      planInitiativeId: [0],
      planGoalsId: [0],
      startDate: [''],
      endDate: [''],
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
      this.planId.set(params['planId']);

      if (this.planId()) {
        this.sharedDataService.setPlanId(this.planId());
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
    if (!this.planId()) {
      console.error('Plan ID not available');
      return;
    }

    // First, get the plan status
    this.getProjectStatus();

    // Also check reports stage status
    this.checkReportsStageStatus();
  }

  getProjectStatus() {
    if (!this.planId()) {
      console.error('Cannot get project status: Plan ID not available');
      return;
    }

    this.planProjectsService.getProjectStatus(this.planId()).subscribe({
      next: (response) => {
        // Set the plan project status from the response
        this.planProjectStatus.set(
          (response as any).status ||
            (response as any).data ||
            ApprovalStatusEnum.Pending
        );

        // Update projects approval status
        this.isProjectsApproved.set(
          this.planProjectStatus() ===
            ApprovalStatusEnum.ApprovedByHighManagement
        );

        // Now load the projects data
        this.loadProjects();

        // Calculate submission button visibility
        this.calculateSubmissionButtonVisibility();

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching plan projects status:', error);

        // If status fetch fails, still try to load projects with default status
        this.planProjectStatus.set(ApprovalStatusEnum.Pending);
        this.loadProjects();
      },
    });
  }

  loadProjects() {
    if (!this.planId()) {
      console.error('Cannot load projects: Plan ID not available');
      return;
    }

    this.loading.set(true);
    this.planProjectsService.getAllProjects(this.planId()).subscribe({
      next: (response) => {
        // Set the projects data
        this.projects.set((response as any).data || response || []);

        // Extract filter options
        this.extractFilterOptions();

        // Calculate submission button visibility
        this.calculateSubmissionButtonVisibility();

        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading projects:', error);

        // Set empty data on error
        this.projects.set([]);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  checkReportsStageStatus() {
    if (!this.planId()) return;

    this.planStatusService.getPlanStatus(this.planId()).subscribe({
      next: (planStatus) => {
        this.isReportsStageActive.set((planStatus as any).reportsStage || true);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching plan status:', error);
        this.isReportsStageActive.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  saveProject() {
    if (this.projectForm.valid) {
      this.planProjectsService
        .createPlanProject(this.planId(), this.projectForm.value)
        .subscribe({
          next: () => {
            this.showForm = false;
            this.projectForm.reset();
            this.loadProjects();
          },
          error: (error) => {
            console.error('Error creating project:', error);
          },
        });
    }
  }

  /**
   * Approve the whole projects stage
   */
  handleApproveProjectsStep(): void {
    const userRole = this.authService.getUserRole();

    if (
      userRole === RolesEnums.UnitManager ||
      userRole === RolesEnums.RegionManager ||
      userRole === RolesEnums.HighManagement
    ) {
      // All manager roles can approve the entire projects stage
      this.planProjectsService.approveProjectStage(this.planId()).subscribe({
        next: () => {
          // Refresh both projects data and stage status
          this.loadProjects();
          this.getProjectStatus(); // This will update planProjectStatus and isProjectsApproved signals
        },
        error: (error: any) => {
          console.error('Error approving projects step:', error);
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
    const stageStatus = this.planProjectStatus();

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
   * Get the current stage status display text
   */
  getCurrentStageStatusDisplay(): string {
    const stageStatus = this.planProjectStatus();
    return this.getStatusDisplayName(stageStatus);
  }

  /**
   * Get CSS class for current stage status badge
   */
  getCurrentStageBadgeClass(): string {
    const stageStatus = this.planProjectStatus();

    const statusClasses: Record<string, string> = {
      [ApprovalStatusEnum.Pending]: 'bg-warning text-dark',
      [ApprovalStatusEnum.ApprovedByUnitManager]: 'bg-info text-white',
      [ApprovalStatusEnum.ApprovedByUnitManagerPartially]: 'bg-info text-white',
      [ApprovalStatusEnum.ApprovedByRegionManager]: 'bg-primary text-white',
      [ApprovalStatusEnum.ApprovedByRegionManagerPartially]:
        'bg-primary text-white',
      [ApprovalStatusEnum.ApprovedByHighManagement]: 'bg-success text-white',
      [ApprovalStatusEnum.ApprovedByHighManagementPartially]:
        'bg-success text-white',
      [ApprovalStatusEnum.RejectedByUnitManager]: 'bg-danger text-white',
      [ApprovalStatusEnum.RejectedByRegionManager]: 'bg-danger text-white',
      [ApprovalStatusEnum.RejectedByHighManagement]: 'bg-danger text-white',
      [ApprovalStatusEnum.ReturnedByUnitManager]: 'bg-secondary text-white',
      [ApprovalStatusEnum.ReturnedByRegionManager]: 'bg-secondary text-white',
      [ApprovalStatusEnum.ReturnedByHighManagement]: 'bg-secondary text-white',
    };

    return statusClasses[stageStatus] || 'bg-light text-dark';
  }

  /**
   * Get hint for next action needed
   */
  getNextActionHint(): string {
    const stageStatus = this.planProjectStatus();
    const userRole = this.authService.getUserRole();

    switch (stageStatus) {
      case ApprovalStatusEnum.Pending:
        if (userRole === RolesEnums.UnitManager) {
          return 'يجب على مدير الوحدة مراجعة وموافقة جميع المشاريع لإرسالها إلى مدير المنطقة';
        }
        return 'في انتظار مدير الوحدة لمراجعة وموافقة المشاريع';

      case ApprovalStatusEnum.ApprovedByUnitManager:
      case ApprovalStatusEnum.ApprovedByUnitManagerPartially:
        if (userRole === RolesEnums.RegionManager) {
          return 'يجب على مدير المنطقة مراجعة وموافقة جميع المشاريع لإرسالها إلى الإدارة العليا';
        }
        return 'في انتظار مدير المنطقة لمراجعة وموافقة المشاريع';

      case ApprovalStatusEnum.ApprovedByRegionManager:
      case ApprovalStatusEnum.ApprovedByRegionManagerPartially:
        if (userRole === RolesEnums.HighManagement) {
          return 'يجب على الإدارة العليا مراجعة وموافقة جميع المشاريع للموافقة النهائية';
        }
        return 'في انتظار الإدارة العليا للموافقة النهائية على المشاريع';

      case ApprovalStatusEnum.ApprovedByHighManagement:
        return 'تم اعتماد جميع المشاريع بنجاح - يمكن الانتقال للمرحلة التالية';

      case ApprovalStatusEnum.RejectedByUnitManager:
        return 'تم رفض المرحلة من مدير الوحدة - يرجى مراجعة التعليقات وإعادة التقديم';

      case ApprovalStatusEnum.RejectedByRegionManager:
        return 'تم رفض المرحلة من مدير المنطقة - يرجى مراجعة التعليقات وإعادة التقديم';

      case ApprovalStatusEnum.RejectedByHighManagement:
        return 'تم رفض المرحلة من الإدارة العليا - يرجى مراجعة التعليقات وإعادة التقديم';

      case ApprovalStatusEnum.ReturnedByUnitManager:
        return 'تم إرجاع المرحلة من مدير الوحدة - يرجى مراجعة التعليقات وإجراء التعديلات المطلوبة';

      case ApprovalStatusEnum.ReturnedByRegionManager:
        return 'تم إرجاع المرحلة من مدير المنطقة - يرجى مراجعة التعليقات وإجراء التعديلات المطلوبة';

      case ApprovalStatusEnum.ReturnedByHighManagement:
        return 'تم إرجاع المرحلة من الإدارة العليا - يرجى مراجعة التعليقات وإجراء التعديلات المطلوبة';

      default:
        return '';
    }
  }

  /**
   * Get CSS class for next action alert
   */
  getNextActionAlertClass(): string {
    const stageStatus = this.planProjectStatus();
    const userRole = this.authService.getUserRole();

    // If current user is the one who needs to take action, highlight it
    const isCurrentUserAction =
      (stageStatus === ApprovalStatusEnum.Pending &&
        userRole === RolesEnums.UnitManager) ||
      ((stageStatus === ApprovalStatusEnum.ApprovedByUnitManager ||
        stageStatus === ApprovalStatusEnum.ApprovedByUnitManagerPartially) &&
        userRole === RolesEnums.RegionManager) ||
      ((stageStatus === ApprovalStatusEnum.ApprovedByRegionManager ||
        stageStatus === ApprovalStatusEnum.ApprovedByRegionManagerPartially) &&
        userRole === RolesEnums.HighManagement);

    if (isCurrentUserAction) {
      return 'bg-warning bg-opacity-25 border border-warning';
    }

    // Status-based styling
    if (stageStatus === ApprovalStatusEnum.ApprovedByHighManagement) {
      return 'bg-success bg-opacity-25 border border-success';
    }

    if (stageStatus.includes('Rejected')) {
      return 'bg-danger bg-opacity-25 border border-danger';
    }

    if (stageStatus.includes('Returned')) {
      return 'bg-secondary bg-opacity-25 border border-secondary';
    }

    return 'bg-info bg-opacity-25 border border-info';
  }

  /**
   * Extract available filter options from projects data
   */
  private extractFilterOptions(): void {
    const projects = this.projects();

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
      ...new Set(projects.map((project) => project.unitName).filter(Boolean)),
    ];
    this.availableUnits.set(units);
  }

  /**
   * Handle status filter change
   */
  onStatusFilterChange(status: string): void {
    this.filterStatus.set(status);
  }

  /**
   * Handle unit filter change
   */
  onUnitFilterChange(unit: string): void {
    this.filterUnit.set(unit);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchTerm.set('');
    this.filterStatus.set('');
    this.filterUnit.set('');
  }

  /**
   * Get user-friendly status name for display
   */
  getStatusDisplayName(status: string): string {
    const statusMap: Record<string, string> = {
      [ApprovalStatusEnum.Pending]: 'في الانتظار',
      [ApprovalStatusEnum.ApprovedByUnitManager]: 'معتمد من مدير الوحدة',
      [ApprovalStatusEnum.ApprovedByUnitManagerPartially]:
        'معتمد جزئياً من مدير الوحدة',
      [ApprovalStatusEnum.ApprovedByRegionManager]: 'معتمد من مدير المنطقة',
      [ApprovalStatusEnum.ApprovedByRegionManagerPartially]:
        'معتمد جزئياً من مدير المنطقة',
      [ApprovalStatusEnum.ApprovedByHighManagement]: 'معتمد من الإدارة العليا',
      [ApprovalStatusEnum.ApprovedByHighManagementPartially]:
        'معتمد جزئياً من الإدارة العليا',
      [ApprovalStatusEnum.RejectedByUnitManager]: 'مرفوض من مدير الوحدة',
      [ApprovalStatusEnum.RejectedByRegionManager]: 'مرفوض من مدير المنطقة',
      [ApprovalStatusEnum.RejectedByHighManagement]: 'مرفوض من الإدارة العليا',
      [ApprovalStatusEnum.ReturnedByUnitManager]: 'مُرجع من مدير الوحدة',
      [ApprovalStatusEnum.ReturnedByRegionManager]: 'مُرجع من مدير المنطقة',
      [ApprovalStatusEnum.ReturnedByHighManagement]: 'مُرجع من الإدارة العليا',
      [ApprovalStatusEnum.SavedAsDraft]: 'مسودة',
    };
    return statusMap[status] || status || 'غير محدد';
  }

  /**
   * Get appropriate CSS class for status badge based on current user role
   */
  getStatusBadgeClass(status: string): string {
    const userRole = this.authService.getUserRole();

    // Define base status classes
    const baseClasses: Record<string, string> = {
      [ApprovalStatusEnum.Pending]: 'bg-warning text-dark',
      [ApprovalStatusEnum.ApprovedByUnitManager]: 'bg-info text-white',
      [ApprovalStatusEnum.ApprovedByUnitManagerPartially]: 'bg-info text-white',
      [ApprovalStatusEnum.ApprovedByRegionManager]: 'bg-primary text-white',
      [ApprovalStatusEnum.ApprovedByRegionManagerPartially]:
        'bg-primary text-white',
      [ApprovalStatusEnum.ApprovedByHighManagement]: 'bg-success text-white',
      [ApprovalStatusEnum.ApprovedByHighManagementPartially]:
        'bg-success text-white',
      [ApprovalStatusEnum.RejectedByUnitManager]: 'bg-danger text-white',
      [ApprovalStatusEnum.RejectedByRegionManager]: 'bg-danger text-white',
      [ApprovalStatusEnum.RejectedByHighManagement]: 'bg-danger text-white',
      [ApprovalStatusEnum.ReturnedByUnitManager]: 'bg-secondary text-white',
      [ApprovalStatusEnum.ReturnedByRegionManager]: 'bg-secondary text-white',
      [ApprovalStatusEnum.ReturnedByHighManagement]: 'bg-secondary text-white',
    };

    // Role-specific highlighting
    if (
      userRole === RolesEnums.UnitManager &&
      status === ApprovalStatusEnum.Pending
    ) {
      return 'bg-warning text-dark border border-warning-emphasis';
    }
    if (
      userRole === RolesEnums.RegionManager &&
      (status === ApprovalStatusEnum.ApprovedByUnitManager ||
        status === ApprovalStatusEnum.ApprovedByUnitManagerPartially)
    ) {
      return 'bg-info text-white border border-info-emphasis';
    }
    if (
      userRole === RolesEnums.HighManagement &&
      (status === ApprovalStatusEnum.ApprovedByRegionManager ||
        status === ApprovalStatusEnum.ApprovedByRegionManagerPartially)
    ) {
      return 'bg-primary text-white border border-primary-emphasis';
    }

    return baseClasses[status] || 'bg-light text-dark';
  }

  /**
   * Check if the current user can add new projects
   */
  canAddItems(): boolean {
    const userRole = this.authService.getUserRole();
    return userRole === RolesEnums.UnitEmployee;
  }

  /**
   * Calculate whether the submission button should be visible.
   *
   * The send rule shared with GoalsController/ProjectController
   * (ApproveProjectStage): nothing sent back, every submitted project approved
   * at this role's level or above, and something to hand on — the stage has not
   * reached this level yet, or this role has approved projects still waiting to
   * be sent.
   *
   * This used to require every project to carry this role's own status, so a
   * project the region manager had already approved kept the unit manager's
   * send button hidden for good, and it looked only at the project rows — the
   * button appeared while a field inside a card was still returned, and the
   * server then refused the send.
   */
  calculateSubmissionButtonVisibility(): boolean {
    const userRole = this.authService.getUserRole();
    const myRank = roleRank(userRole);
    if (myRank === 0) return false;

    const submitted = this.projects().filter(
      (project) => project.status !== ApprovalStatusEnum.SavedAsDraft
    );
    if (submitted.length === 0) return false;

    if (submitted.some((project) => isSentBack(project.status))) return false;
    if (submitted.some((project) => approvalRank(project.status) < myRank)) {
      return false;
    }

    return (
      approvalRank(this.planProjectStatus()) < myRank ||
      submitted.some((project) => isPartialOf(project.status, userRole))
    );
  }

  closeSuccessPopup() {
    this.isSuccessPopupVisible = false;
  }

  /**
   * Project action methods
   */
  viewProject(project: any): void {
    if (project && project.id) {
      // Fetch detailed data from API instead of using table data
      this.planProjectsService.getProjectById(project.id).subscribe({
        next: (detailedProject) => {
          this.viewingProject.set(detailedProject);
        },
        error: (error) => {
          console.error('Error fetching project details:', error);
          // Fallback to table data if API fails
          this.viewingProject.set(project);
        },
      });
    } else {
      console.error('Invalid project data for viewing:', project);
    }
  }

  closeViewModal(): void {
    this.viewingProject.set(null);
  }

  editProject(project: any): void {
    // Implementation for edit can be added later
    console.log('Edit project:', project);
  }

  deleteProject(project: any): void {
    this.deletingProject = project;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.deletingProject) {
      this.planProjectsService
        .deletePlanProject(this.deletingProject.id.toString())
        .subscribe({
          next: () => {
            this.loadProjects();
            this.cancelDelete();
          },
          error: (error) => {
            console.error('Error deleting project:', error);
            this.cancelDelete();
          },
        });
    }
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.deletingProject = null;
  }

  /**
   * Permission check methods
   */
  canEditProject(project: any): boolean {
    const userRole = this.authService.getUserRole();
    if (userRole !== RolesEnums.UnitEmployee) return false;

    // Editable while the project is not yet approved at any level.
    // Once approved it is locked; a reject/return reopens it until final approval.
    const status = project.status;
    const isDraft = status === ApprovalStatusEnum.SavedAsDraft;
    const isPending = PendingStatuses.includes(status);
    const isReturned = ReturnedStatuses.includes(status);
    const isRejected = RejectionStatuses.includes(status);

    return isDraft || isPending || isReturned || isRejected;
  }

  canDeleteProject(project: any): boolean {
    return this.permissionsService.canDeleteItem('Projects', project);
  }

  /**
   * Handle popup option selection
   */
  onSelectedOption(event: Record<string, any>): void {
    const project = this.projects().find((proj) => proj.id === event['id']);

    switch (event['type']) {
      case 'view':
        this.viewProject(project);
        break;
      case 'edit':
        this.editProject(project);
        break;
      case 'delete':
        this.deleteProject(project);
        break;
    }
  }

  /**
   * Handle data updates from the view modal
   */
  onProjectDataUpdated(): void {
    // Refresh the projects list to reflect changes in the table
    this.loadProjects();
  }

  /**
   * Handle search term change
   */
  onSearchChange(): void {
    console.log('Search term changed to:', this.searchTerm());
  }

  /**
   * Clear search term
   */
  clearSearch(): void {
    this.searchTerm.set('');
  }

  // Modal methods
  openAddModal() {
    console.log('Opening add modal');
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
  }

  onProjectAdded() {
    this.loadProjects();
    this.closeAddModal();
  }

  /**
   * Get project-specific status badge class (enhanced version)
   */
  getProjectStatusBadgeClass(project: any): string {
    if (this.needsCurrentUserAction(project)) {
      return 'bg-warning text-dark border border-warning fw-bold';
    }
    return this.getStatusBadgeClass(project.status);
  }

  /**
   * Check if current user needs to take action on this specific project
   */
  needsCurrentUserAction(project: any): boolean {
    if (!project || !project.status) return false;

    // Same ladder as the project card: something below this role's level while
    // the stage is with this role.
    return canRoleActInStage(
      project.status,
      this.planProjectStatus(),
      this.authService.getUserRole()
    );
  }

  /**
   * Get CSS class for project row highlighting
   */
  getProjectRowClass(project: any): string {
    if (this.needsCurrentUserAction(project)) {
      return 'table-warning border-warning';
    }
    return '';
  }

  /**
   * Get CSS class for project name styling
   */
  getProjectNameClass(project: any): string {
    if (this.needsCurrentUserAction(project)) {
      return 'text-warning-emphasis fw-bold';
    }
    return 'text-dark';
  }

  /**
   * Get action text for current user
   */
  getCurrentUserActionText(): string {
    const userRole = this.authService.getUserRole();

    switch (userRole) {
      case RolesEnums.UnitManager:
        return 'يحتاج موافقتك';
      case RolesEnums.RegionManager:
        return 'يحتاج مراجعتك';
      case RolesEnums.HighManagement:
        return 'يحتاج موافقتك النهائية';
      default:
        return 'يحتاج إجراء';
    }
  }
  generatePDF(): void {
  const planId = Number(this.route.snapshot.paramMap.get('planId'));

  if (!planId || isNaN(planId)) {
    console.error('planId غير موجود أو غير صحيح');
    return;
  }

  this.PdfService.getPdfforproject(planId).subscribe({
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

  this.app.ApproveProject(planId).subscribe({
    next: (blob) => {
      window.location.reload();
    },
    error: (err) => {
      console.error('حصل خطأ أثناء تحميل الـ PDF', err);
    }
  });
}

}
