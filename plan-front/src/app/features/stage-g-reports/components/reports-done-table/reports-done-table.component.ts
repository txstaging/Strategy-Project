import { ChangeDetectorRef, Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReportsService } from '../../services/reports.service';
import {
  IGetReportsResponse,
  Project,
  Unit,
} from '../../interfaces/IGetReportsResponse';
import { PlanProjectsService } from '../../../stage-f-projects/services/plan-projects.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { ActionsAdminComponent } from '../../../../shared/components/app-admin-actions/app-admin-actions.component';
import { StatusActionComponent } from '../../../../shared/components/status-action/status.component';
import { PageTitleService } from '../../../page-titles/services/page-title.service';
import { environment } from '../../../../../environments/environment.dev';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-reports-done-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ActionsAdminComponent, StatusActionComponent],
  templateUrl: './reports-done-table.component.html',
  styleUrl: './reports-done-table.component.css',
})
export class ReportsDoneTableComponent implements OnInit {
  constructor(
    public router: Router,
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef
  ) {}

  private authService = inject(AuthService);
  private projectsService = inject(PlanProjectsService);
  private pageTitleService = inject(PageTitleService);
  titlesMap = signal<Record<string, string>>({});

  reportsData: Unit[] = [];
  totalPercentage = 0;

  // Expand/collapse functionality with string-based keys
  expandedSections = signal<Record<string, boolean>>({});

  // Edit mode for projects
  editingProject: number | null = null;
  editingPercentage = 0;
  editingFile: File | null = null;

  // Reason modal for reject/return
  showReasonModal = false;
  reasonModalType: 'reject' | 'return' | null = null;
  reasonComment = '';
  private currentActionProjectId = 0;

  // Check if current user is allowed to approve
  get isAllowToApprove(): boolean {
    return this.authService.allowInRoles([
      RolesEnums.HighManagement,
      RolesEnums.RegionManager,
      RolesEnums.UnitManager,
    ]);
  }

  /**
   * Check if current manager has already taken action on an item
   */
  isActionAlreadyTaken(status: string): boolean {
    if (!status) return false;

    const userRole = this.authService.getUserRole();

    if (userRole === RolesEnums.UnitManager) {
      return status.includes('UnitManager');
    }
    if (userRole === RolesEnums.RegionManager) {
      return status.includes('RegionManager');
    }
    if (userRole === RolesEnums.HighManagement) {
      return status.includes('HighManagement');
    }

    return false;
  }

  /**
   * Stage-aware: only show approve/reject/return for the role whose turn it is.
   *   Pending                          → UnitManager
   *   ApprovedByUnitManager*           → RegionManager
   *   ApprovedByRegionManager*         → HighManagement
   * Anything else (already acted at this level, returned/rejected, finalized) hides the buttons.
   */
  canActOnPercentage(status: string | undefined | null): boolean {
    if (!status) return false;
    const userRole = this.authService.getUserRole();

    if (userRole === RolesEnums.UnitManager) {
      return status === 'Pending';
    }
    if (userRole === RolesEnums.RegionManager) {
      return status === 'ApprovedByUnitManager' || status === 'ApprovedByUnitManagerPartially';
    }
    if (userRole === RolesEnums.HighManagement) {
      return status === 'ApprovedByRegionManager' || status === 'ApprovedByRegionManagerPartially';
    }
    return false;
  }

  /**
   * Handle approve percentage item via the dedicated reports endpoint.
   */
  handleApprovePercentage(project: Project): void {
    this.reportsService.approvePercentage(project.projectId).subscribe({
      next: () => {
        project.percentageStatus = this.getApprovedStatusForCurrentRole();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error approving percentage:', error);
      },
    });
  }

  /**
   * Handle reject percentage item
   */
  handleRejectPercentage(project: Project): void {
    this.currentActionProjectId = project.projectId;
    this.reasonModalType = 'reject';
    this.showReasonModal = true;
  }

  /**
   * Handle return percentage item
   */
  handleReturnPercentage(project: Project): void {
    this.currentActionProjectId = project.projectId;
    this.reasonModalType = 'return';
    this.showReasonModal = true;
  }

  closeReasonModal(): void {
    this.showReasonModal = false;
    this.reasonModalType = null;
    this.reasonComment = '';
    this.currentActionProjectId = 0;
  }

  submitReasonAction(): void {
    if (!this.reasonComment.trim()) return;

    if (this.reasonModalType === 'reject') {
      this.reportsService
        .rejectPercentage(this.currentActionProjectId, this.reasonComment)
        .subscribe({
          next: () => {
            this.updateProjectPercentageStatus(
              this.currentActionProjectId,
              this.getRejectedStatusForCurrentRole(),
              this.reasonComment
            );
            this.closeReasonModal();
          },
          error: (error) => {
            console.error('Error rejecting percentage:', error);
          },
        });
    } else if (this.reasonModalType === 'return') {
      this.reportsService
        .returnPercentage(this.currentActionProjectId, this.reasonComment)
        .subscribe({
          next: () => {
            this.updateProjectPercentageStatus(
              this.currentActionProjectId,
              this.getReturnedStatusForCurrentRole(),
              this.reasonComment
            );
            this.closeReasonModal();
          },
          error: (error) => {
            console.error('Error returning percentage:', error);
          },
        });
    }
  }

  private updateProjectPercentageStatus(projectId: number, status: string, comment?: string): void {
    for (const unit of this.reportsData) {
      for (const goal of unit.goals) {
        for (const initiative of goal.initiatives) {
          const project = initiative.projects.find((p) => p.projectId === projectId);
          if (project) {
            project.percentageStatus = status;
            if (comment) {
              project.percentageComment = comment;
            }
            this.cdr.detectChanges();
            return;
          }
        }
      }
    }
  }

  private getApprovedStatusForCurrentRole(): string {
    const userRole = this.authService.getUserRole();
    if (userRole === RolesEnums.UnitManager) return 'ApprovedByUnitManager';
    if (userRole === RolesEnums.RegionManager) return 'ApprovedByRegionManager';
    if (userRole === RolesEnums.HighManagement) return 'ApprovedByHighManagement';
    return 'Approved';
  }

  private getRejectedStatusForCurrentRole(): string {
    const userRole = this.authService.getUserRole();
    if (userRole === RolesEnums.UnitManager) return 'RejectedByUnitManager';
    if (userRole === RolesEnums.RegionManager) return 'RejectedByRegionManager';
    if (userRole === RolesEnums.HighManagement) return 'RejectedByHighManagement';
    return 'Rejected';
  }

  private getReturnedStatusForCurrentRole(): string {
    const userRole = this.authService.getUserRole();
    if (userRole === RolesEnums.UnitManager) return 'ReturnedByUnitManager';
    if (userRole === RolesEnums.RegionManager) return 'ReturnedByRegionManager';
    if (userRole === RolesEnums.HighManagement) return 'ReturnedByHighManagement';
    return 'Returned';
  }

  // Toggle section expansion using string keys
  toggleSection(sectionKey: string): void {
    this.expandedSections.update((sections) => ({
      ...sections,
      [sectionKey]: !sections[sectionKey],
    }));
  }

  // Check if section is expanded using string keys
  isSectionExpanded(sectionKey: string): boolean {
    return this.expandedSections()[sectionKey] ?? false;
  }

  // Start editing project percentage
  startEditProject(projectId: number, currentPercentage: number): void {
    this.editingProject = projectId;
    this.editingPercentage = currentPercentage;
    this.editingFile = null;
  }

  // Cancel editing
  cancelEdit(): void {
    this.editingProject = null;
    this.editingPercentage = 0;
    this.editingFile = null;
  }

  // File picker handler — picks the file but doesn't upload until save.
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  // Resolve a relative attachment path (e.g. "Uploads/Reports/abc.png")
  // to the absolute backend URL so the link works from the dev server too.
  fileUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path; // already absolute
    const apiRoot = environment.BACKEND_URL.replace(/\/api\/?$/, '');
    return `${apiRoot}/${path.replace(/^\/+/, '')}`;
  }

  // Save project percentage (with optional file attachment)
  saveProjectPercentage(projectId: number): void {
    if (this.editingPercentage < 0 || this.editingPercentage > 100) {
      alert('النسبة يجب أن تكون بين 0 و 100');
      return;
    }

    this.reportsService
      .submitPercentage(projectId, this.editingPercentage, this.editingFile)
      .subscribe({
        next: (res: any) => {
          // Update the project percentage in local data
          const oldPercentage = this.getProjectCurrentPercentage(projectId);
          this.updateProjectInData(projectId, this.editingPercentage, res?.filePath ?? undefined);

          console.log(
            `Project ${projectId} updated from ${oldPercentage} to ${this.editingPercentage}`
          );

          // Recalculate all dependent percentages
          this.recalculatePercentages();

          console.log(
            'Total percentage after recalculation:',
            this.totalPercentage
          );

          this.cancelEdit();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error updating project percentage:', error);
          alert('حدث خطأ أثناء تحديث النسبة');
        },
      });
  }

  // Helper method to get current project percentage
  private getProjectCurrentPercentage(projectId: number): number | null {
    for (const unit of this.reportsData) {
      for (const goal of unit.goals) {
        for (const initiative of goal.initiatives) {
          const project = initiative.projects.find(
            (p) => p.projectId === projectId
          );
          if (project) {
            return project.percentage;
          }
        }
      }
    }
    return null;
  }

  // Update project percentage in local data
  private updateProjectInData(projectId: number, newPercentage: number, newFilePath?: string): void {
    for (const unit of this.reportsData) {
      for (const goal of unit.goals) {
        for (const initiative of goal.initiatives) {
          const project = initiative.projects.find(
            (p) => p.projectId === projectId
          );
          if (project) {
            project.percentage = newPercentage;
            // After editing, set status back to Pending
            project.percentageStatus = 'Pending';
            project.percentageComment = null;
            if (newFilePath) {
              project.percentageFilePath = newFilePath;
            }
            return;
          }
        }
      }
    }
  }

  // Recalculate all percentages after project update
  private recalculatePercentages(): void {
    // Recalculate percentages for each unit independently
    for (const unit of this.reportsData) {
      // First, recalculate all initiative percentages
      for (const goal of unit.goals) {
        for (const initiative of goal.initiatives) {
          if (initiative.projects.length > 0) {
            const validProjects = initiative.projects.filter(
              (p) => p.percentage !== null && p.percentage !== undefined
            );
            if (validProjects.length > 0) {
              const totalProjectPercentage = validProjects.reduce(
                (acc, project) => acc + (project.percentage || 0),
                0
              );
              initiative.initiativePercentage =
                Math.round(
                  (totalProjectPercentage / validProjects.length) * 100
                ) / 100;
            } else {
              initiative.initiativePercentage = 0;
            }
          } else {
            initiative.initiativePercentage = 0;
          }
        }
      }

      // Then, recalculate all goal percentages
      for (const goal of unit.goals) {
        if (goal.initiatives.length > 0) {
          const validInitiatives = goal.initiatives.filter(
            (i) =>
              i.initiativePercentage !== null &&
              i.initiativePercentage !== undefined
          );
          if (validInitiatives.length > 0) {
            const totalInitiativePercentage = validInitiatives.reduce(
              (acc, initiative) => acc + (initiative.initiativePercentage || 0),
              0
            );
            goal.goalPercentage =
              Math.round(
                (totalInitiativePercentage / validInitiatives.length) * 100
              ) / 100;
          } else {
            goal.goalPercentage = 0;
          }
        } else {
          goal.goalPercentage = 0;
        }
      }

      // Finally, recalculate unit percentage
      if (unit.goals.length > 0) {
        const validGoals = unit.goals.filter(
          (g) => g.goalPercentage !== null && g.goalPercentage !== undefined
        );
        if (validGoals.length > 0) {
          const totalGoalPercentage = validGoals.reduce(
            (acc, goal) => acc + (goal.goalPercentage || 0),
            0
          );
          unit.unitPercentage =
            Math.round((totalGoalPercentage / validGoals.length) * 100) / 100;
        } else {
          unit.unitPercentage = 0;
        }
      } else {
        unit.unitPercentage = 0;
      }
    }

    // Recalculate total percentage
    if (this.reportsData.length > 0) {
      const validUnits = this.reportsData.filter(
        (u) => u.unitPercentage !== null && u.unitPercentage !== undefined
      );
      if (validUnits.length > 0) {
        const totalUnitsPercentage = validUnits.reduce(
          (acc: number, unit: Unit) => acc + (unit.unitPercentage || 0),
          0
        );
        this.totalPercentage =
          Math.round((totalUnitsPercentage / validUnits.length) * 100) / 100;
      } else {
        this.totalPercentage = 0;
      }
    } else {
      this.totalPercentage = 0;
    }

    // Force change detection
    this.cdr.markForCheck();
  }

  // Print functionality - Download as PDF
  async printTable(): Promise<void> {
    try {
      // Temporarily expand all sections for PDF generation
      const originalExpandedSections = { ...this.expandedSections() };

      // Expand all sections
      const allSectionKeys: string[] = [];
      this.reportsData.forEach((unit) => {
        allSectionKeys.push(`unit-${unit.unitId}`);
        allSectionKeys.push(`goals-${unit.unitId}`);
        allSectionKeys.push(`initiatives-${unit.unitId}`);
        allSectionKeys.push(`projects-${unit.unitId}`);
      });

      const expandedSections: Record<string, boolean> = {};
      allSectionKeys.forEach((key) => {
        expandedSections[key] = true;
      });
      this.expandedSections.set(expandedSections);
      this.cdr.detectChanges();

      // Wait a bit for the DOM to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get the table element
      const tableElement = document.querySelector('table');
      if (!tableElement) {
        console.error('Table element not found');
        return;
      }

      // Create a wrapper div with proper styling
      const wrapper = document.createElement('div');
      wrapper.style.direction = 'rtl';
      wrapper.style.fontFamily = 'Arial, sans-serif';
      wrapper.style.fontSize = '12px';
      wrapper.style.padding = '20px';
      wrapper.style.backgroundColor = 'white';
      wrapper.style.width = '210mm'; // A4 width

      // Add title
      const title = document.createElement('h1');
      title.textContent = this.t('reports_title', 'التقارير');
      title.style.textAlign = 'center';
      title.style.color = '#28a745';
      title.style.marginBottom = '30px';
      title.style.fontSize = '20px';
      wrapper.appendChild(title);

      // Clone and style the table
      const tableClone = tableElement.cloneNode(true) as HTMLElement;
      tableClone.style.width = '100%';
      tableClone.style.borderCollapse = 'collapse';
      tableClone.style.fontSize = '10px';

      // Remove all Bootstrap icons and buttons from the cloned table
      const iconsAndButtons = tableClone.querySelectorAll(
        'i, button, .d-print-none'
      );
      iconsAndButtons.forEach((element) => {
        element.remove();
      });

      // Clean up button containers that might be empty now
      const emptyContainers = tableClone.querySelectorAll('.d-flex.gap-2');
      emptyContainers.forEach((container) => {
        if (container.children.length === 0) {
          container.remove();
        }
      });

      // Style all cells
      const cells = tableClone.querySelectorAll('th, td');
      cells.forEach((cell) => {
        const cellElement = cell as HTMLElement;
        cellElement.style.border = '1px solid #333';
        cellElement.style.padding = '8px';
        cellElement.style.textAlign = 'right';
        cellElement.style.verticalAlign = 'top';
      });

      // Style headers
      const headers = tableClone.querySelectorAll('th');
      headers.forEach((header) => {
        const headerElement = header as HTMLElement;
        headerElement.style.backgroundColor = '#28a745';
        headerElement.style.color = 'white';
        headerElement.style.fontWeight = 'bold';
      });

      wrapper.appendChild(tableClone);

      // Add footer
      const footer = document.createElement('div');
      footer.style.textAlign = 'center';
      footer.style.marginTop = '20px';
      footer.style.fontSize = '10px';
      footer.style.color = '#666';
      footer.textContent = `تم إنشاء التقرير في: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}`;
      wrapper.appendChild(footer);

      // Temporarily add to body for rendering
      document.body.appendChild(wrapper);

      // Generate PDF
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: wrapper.offsetWidth,
        height: wrapper.offsetHeight,
      });

      // Remove wrapper from body
      document.body.removeChild(wrapper);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // Top margin

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      // Download the PDF
      const fileName = `تقرير-نسبة-الإنجاز-${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}.pdf`;
      pdf.save(fileName);

      // Restore original expanded sections
      this.expandedSections.set(originalExpandedSections);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF');
    }
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
    this.reportsService.getReportsData().subscribe({
      next: (response: IGetReportsResponse) => {
        // Set the raw data first
        this.reportsData = response;

        // Then recalculate all percentages to ensure consistency
        this.recalculatePercentages();

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching reports data:', error);
        this.reportsData = [];
        this.totalPercentage = 0;
        this.cdr.detectChanges();
      },
    });
  }
}
