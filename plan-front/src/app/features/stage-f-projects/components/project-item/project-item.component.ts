import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PlanProjectsService } from '../../services/plan-projects.service';
import {
  ApprovalStatusEnum,
  PendingStatuses,
  RejectionStatuses,
  ReturnedStatuses,
  RolesEnums,
} from '../../../../Core/utilities/consts';
import { AuthService } from '../../../../features/auth/services/auth.service';
import { StatusActionComponent } from '../../../../shared/components/status-action/status.component';
import { ProjectEditModalComponent } from '../project-edit-modal/project-edit-modal.component';
import { ProjectViewModalComponent } from '../project-view-modal/project-view-modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProjectEditModalComponent,
    StatusActionComponent,
    ProjectViewModalComponent,
  ],
  templateUrl: './project-item.component.html',
  styleUrl: './project-item.component.css',
})
export class ProjectItemComponent {
  @Input() project: any;
  @Input() planId: any;
  @Output() dataRefreshNeeded = new EventEmitter<void>();
  showViewModal = false;
  showEditModal = false;
  detailedProject: any = null;
  detailedProjectForEdit: any = null;

  constructor(
    private authService: AuthService,
    private projectsService: PlanProjectsService
  ) {}

  /**
   * Helper method to safely get display value from either flat or nested data structure
   */
  getProjectDisplayValue(field: any): string {
    if (!field) return '';
    // If it's a nested object with 'value' property, return field.value
    if (typeof field === 'object' && field.value !== undefined) {
      return field.value;
    }
    // If it's a direct value, return it
    return field.toString();
  }

  openEditModal() {
    const projectId = this.project?.id || this.project?.projectId;

    if (projectId) {
      // Fetch detailed data for edit modal
      this.projectsService.getProjectById(projectId.toString()).subscribe({
        next: (detailedProject) => {
          this.detailedProjectForEdit = detailedProject;
          this.showEditModal = true;
        },
        error: (error) => {
          console.error('Error fetching project details for edit:', error);
          // Fallback to list data if API fails
          this.detailedProjectForEdit = this.project;
          this.showEditModal = true;
        },
      });
    } else {
      console.error('Cannot open edit modal: Project ID not found');
    }
  }

  openViewModal() {
    const projectId = this.project?.id || this.project?.projectId;

    if (projectId) {
      // Fetch detailed data for view modal
      this.projectsService.getProjectById(projectId.toString()).subscribe({
        next: (detailedProject) => {
          this.detailedProject = detailedProject;
          this.showViewModal = true;
        },
        error: (error) => {
          console.error('Error fetching project details for view:', error);
          // Fallback to list data if API fails
          this.detailedProject = this.project;
          this.showViewModal = true;
        },
      });
    } else {
      console.error('Cannot open view modal: Project ID not found');
    }
  }

  /**
   * Handle project update completion
   */
  onProjectUpdated() {
    this.dataRefreshNeeded.emit();
  }

  /**
   * Checks if an employee can edit a project based on its status
   * According to workflow:
   * - Unit Employees can edit points that are:
   *   1. In Pending status
   *   2. Have been returned by Region Manager or High Management
   *   (Cannot edit rejected points)
   * @returns boolean indicating if the employee can edit the project
   */
  canEditBasedOnStatus(): boolean {
    // If project is null or doesn't have status, return false
    if (!this.project || !this.project.status) return false;

    // Get the current user role
    const userRole = this.authService.getUserRole();
    if (!userRole) return false;

    // If user is not an employee, this function is not relevant
    if (userRole !== RolesEnums.UnitEmployee) return false;

    // Editable while the project is not yet approved at any level.
    // Once approved it is locked; a reject/return reopens it until final approval.
    const isDraft = this.project.status === ApprovalStatusEnum.SavedAsDraft;
    const isPending = PendingStatuses.includes(this.project.status);
    const isReturned = ReturnedStatuses.includes(this.project.status);
    const isRejected = RejectionStatuses.includes(this.project.status);

    return isDraft || isPending || isReturned || isRejected;
  }
}
