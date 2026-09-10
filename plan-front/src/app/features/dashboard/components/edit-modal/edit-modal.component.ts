import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PermissionsService } from '../../../../Core/Service/permissions.service';
import { IPermissionData } from '../../interfaces/IPermissionData';

@Component({
  selector: 'app-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-modal.component.html',
  styleUrls: ['./edit-modal.component.css'],
})
export class EditModalComponent implements OnInit {
  @Input() set isOpen(value: boolean) {
    if (value && this._isOpen !== value) {
      // Modal is being opened
      this.resetForm();
    }
    this._isOpen = value;
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  private _isOpen = false;

  @Input() initialPermissions?: IPermissionData;
  @Input() userId?: string;
  @Input() isRegister?: boolean;
  @Input() role?: string;
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() savePermissions = new EventEmitter<IPermissionData>();

  permissionsForm: FormGroup;

  // Available pages and actions - match with permissions-table component
  pages = [
    'Analysis',
    'Direction',
    'Goals',
    'Initiative',
    'Projects',
    'Plans',
    'Reports',
  ];
  actions = ['GetAll', 'GetOne', 'Add', 'Update', 'Delete', 'Approve', 'Reject', 'Return'];

  constructor(
    private fb: FormBuilder,
    private permissionsService: PermissionsService
  ) {
    this.permissionsForm = this.fb.group({});
    this.initializeForm();
  }

  private initializeForm(): void {
    // Create form controls for each action
    this.actions.forEach((action) => {
      const controls: Record<string, boolean> = {};
      this.pages.forEach((page) => {
        controls[page] = false;
      });
      this.permissionsForm.addControl(action, this.fb.group(controls));
    });
  }

  ngOnInit(): void {
    if (this.initialPermissions) {
      this.setInitialValues(this.initialPermissions);
    }
  }

  private setInitialValues(data: IPermissionData): void {
    // First reset all checkboxes to false
    this.actions.forEach((action) => {
      const actionGroup = this.permissionsForm.get(action);
      if (actionGroup) {
        this.pages.forEach((page) => {
          actionGroup.get(page)?.setValue(false);
        });
      }
    });

    // Then set the checkboxes based on the permissions data
    Object.entries(data?.modulePermissions || {}).forEach(([page, actions]) => {
      actions.forEach((action) => {
        const actionGroup = this.permissionsForm.get(action);
        if (actionGroup) {
          actionGroup.get(page)?.setValue(true);
        }
      });
    });
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }

  onSubmit(): void {
    if (this.permissionsForm.valid) {
      const result: IPermissionData = {
        modulePermissions: {},
      };

      this.pages.forEach((page) => {
        const selectedActions = this.actions.filter(
          (action) =>
            this.permissionsForm.get(action)?.get(page)?.value === true
        );

        if (selectedActions.length > 0) {
          result.modulePermissions[page] = selectedActions;
        }
      });

      // If userId is provided, update permissions in the backend
      if (this.userId && this.role && !this.isRegister) {
        this.permissionsService
          .updateUserPermissions(this.userId, this.role, result)
          .subscribe({
            next: () => {
              this.savePermissions.emit(result);
              this.closeModal();
            },
          });
      } else {
        this.savePermissions.emit(result);
        this.closeModal();
      }
    }
  }

  getPageName(pageKey: string): string {
    const pageMap: Record<string, string> = {
      Analysis: 'التحليل',
      Direction: 'التوجه الاستراتيجي',
      Goals: 'الأهداف',
      Initiative: 'المبادرات',
      Projects: 'المشاريع',
      Plans: 'الخطط',
      Reports: 'التقارير',
    };
    return pageMap[pageKey] || pageKey;
  }

  private resetForm(): void {
    // Reset the form when the modal opens
    this.initializeForm();
    if (this.initialPermissions) {
      this.setInitialValues(this.initialPermissions);
    }
  }
}
