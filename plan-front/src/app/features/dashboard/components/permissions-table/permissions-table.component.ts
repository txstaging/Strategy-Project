import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ChangeDetectorRef,
} from '@angular/core';
import { EditModalComponent } from '../edit-modal/edit-modal.component';
import { IPermissionData } from '../../interfaces/IPermissionData';
import { IPermission } from '../../interfaces/IPermission';

@Component({
  selector: 'app-permissions-table',
  standalone: true,
  imports: [CommonModule, EditModalComponent],
  styleUrl: './permissions-table.component.css',
  templateUrl: './permissions-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsTableComponent {
  @Input() employeeName = '';
  @Input() permissionData: IPermissionData = { modulePermissions: {} };
  @Input() userId?: string;
  @Input() role?: string;
  // Static permission actions
  permissionActions: IPermission[] = [
    { name: 'الموافقة', type: 'Approve' },
    { name: 'الرفض', type: 'Reject' },
    { name: 'الاسترجاع', type: 'Return' },
    { name: 'الاضافة', type: 'Add' },
    { name: 'التعديل', type: 'Update' },
    { name: 'الحذف', type: 'Delete' },
  ];

  // Page mapping (English to Arabic)
  pages = [
    { key: 'Analysis', name: 'التحليل' },
    { key: 'Direction', name: 'التوجه الاستراتيجي' },
    { key: 'Goals', name: 'الأهداف' },
    { key: 'Initiative', name: 'المبادرات' },
    { key: 'Projects', name: 'المشاريع' },
    { key: 'Plans', name: 'الخطط' },
    { key: 'Reports', name: 'التقارير' },
  ];

  isModalOpen = false;

  constructor(private cdr: ChangeDetectorRef) {}

  // Check if a permission exists for a specific page and action
  hasPermission(page: string, action: string): boolean {
    if (!this.permissionData?.modulePermissions?.[page]) {
      return false;
    }
    return this.permissionData.modulePermissions[page].includes(action);
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.cdr.markForCheck();
  }

  onEdit(): void {
    console.log('Edit clicked for:', this.employeeName);
  }

  getPermissionClass(type: string): string {
    return `permission-type ${type.toLowerCase()}`;
  }

  // Call this method after updating modulePermissions data
  refreshPermissions(): void {
    this.cdr.markForCheck();
  }

  handlePermissionsSave(permissions: IPermissionData): void {
    this.permissionData = permissions;
    this.closeModal();
    this.refreshPermissions();
  }
}
