import { ChangeDetectorRef, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PermissionsService } from '../../../../Core/Service/permissions.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { PermissionsTableComponent } from '../../components/permissions-table/permissions-table.component';
import { IGetAllUsers, MetaDataDto } from '../../interfaces/iget-all-users';

@Component({
  selector: 'app-controllers',
  standalone: true,
  imports: [
    PermissionsTableComponent,
    RouterModule,
    FormsModule,
    CommonModule,
    NgSelectModule,
  ],
  templateUrl: './controllers.component.html',
  styleUrl: './controllers.component.css',
})
export class ControllersComponent {
  employeeName = '';
  userRoles = [
    { value: RolesEnums.UnitEmployee, name: 'موظف الوحدة' },
    { value: RolesEnums.UnitManager, name: 'مدير الوحدة' },
    { value: RolesEnums.RegionManager, name: 'مدير المنطقة' },
    { value: RolesEnums.HighManagement, name: 'الإدارة العليا' },
  ];
  employees: any[] = [];
  selectedRole = '';
  selectedEmployee = '';
  permissions: any = [];
  users:IGetAllUsers[] = [];
  metadata!: MetaDataDto;
  currentPage: number = 1;
  perPage: number = 5;

  constructor(
    private permissionsService: PermissionsService,
    private cdr: ChangeDetectorRef
  ) {}

  onRoleChange(event: any): void {
    const selectedRole = event;
    if (selectedRole) {
      this.loadUsersPermissions(selectedRole);
    }
  }

  onEmployeeChange(event: any): void {
    if (!event) return;

    const selectedEmployeeId = event;
    const selectedEmployeeObj = this.employees.find(
      (emp) => emp.id === +selectedEmployeeId
    );
    this.employeeName = selectedEmployeeObj ? selectedEmployeeObj.name : '';

    if (selectedEmployeeId) {
      this.permissionsService
        .getPermissionsByUserId(selectedEmployeeId.id)
        .subscribe({
          next: (response) => {
            this.permissions = response;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error loading permissions:', err);
          },
        });
    }
  }

  loadUsersPermissions(roleId: { value: string }): void {
    this.permissionsService
      .getAllUsersRolesAndPermissions(roleId.value)
      .subscribe({
        next: (response) => {
          this.employees = response;
          this.selectedEmployee = '';
        },
        error: (err) => {
          console.error('Error loading permissions:', err);
        },
      });
  }
  
}
