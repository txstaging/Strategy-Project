import { UserControllerServiceService } from './../../services/user-controller-service.service';
import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { PagesHeaderComponent } from "../../../../shared/components/pages-header/pages-header.component";
import { NgSelectModule } from '@ng-select/ng-select';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { PermissionsService } from '../../../../Core/Service/permissions.service';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';
import { IGetAllUsers, MetaDataDto } from '../../interfaces/iget-all-users';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-controller',
  standalone: true,
  imports: [NgSelectModule,FormsModule, ReactiveFormsModule,NgFor ,RouterLink],
  templateUrl: './user-controller.component.html',
  styleUrl: './user-controller.component.css'
})
export class UserControllerComponent implements OnInit {
toggleUserStatus(user: any) {
  this.isLoading = true; // لو عايز تظهر سبينر

  this.userService.toggleUserStatus(user.id).subscribe({
    next: (response) => {
      user.isActive = response.isActive;
      this.isLoading = false;
    },
    error: (err) => {
      console.error('فشل في تغيير الحالة', err);
      this.isLoading = false;
    }
  });
}



  constructor(
      private permissionsService: PermissionsService,
      private cdr: ChangeDetectorRef, private userService: UserControllerServiceService
    ) {}
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
isHighManagement = signal(true);

  // Special operation statuses
  markingAllInactive = signal(true);
showConfirmDialog = signal(false);
  confirmMessage = '';
  confirmDangerMode = true;


  // Loading and error states
  isLoading = false;
  error: string | null = null;
  // Table data
  blogs:string[]=[];
  paginatedBlogs: string[] = [];

  // Search and filter
  searchTerm = '';
  filterOption = 'all';

  // Pagination


  // Confirmation dialog state


   onRoleChange(event: any): void {
    const selectedRole = event;
    if (selectedRole) {
      this.loadUsersPermissions(selectedRole);
    }
  }

totalPages = 20; // عدد الصفحات الكلي
pages: number[] = [];
visiblePages: number[] = [];

ngOnInit() {
  this.loadUsers()
}
updateVisiblePages() {
  const maxVisible = 5;
  const pages: number[] = [];

  let start = Math.max(this.currentPage - Math.floor(maxVisible / 2), 1);
  let end = start + maxVisible - 1;

  if (end > this.totalPages) {
    end = this.totalPages;
    start = Math.max(end - maxVisible + 1, 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  this.visiblePages = pages;
}

generatePages() {
  this.pages = [];
  for (let i = 1; i <= this.totalPages; i++) {
    this.pages.push(i);
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
  users: IGetAllUsers[] = [];
  metadata!: MetaDataDto;
  currentPage: number = 1;
  perPage: number = 5;
loadUsers() {
  this.userService.getAllUsers(this.perPage, this.currentPage).subscribe(response => {
    this.users = response.data;
    this.metadata = response.metadata;
    this.generateVisiblePages();
  });
}

changePage(page: number) {
  if (page >= 1 && page <= this.metadata.lastPage) {
    this.currentPage = page;
    this.loadUsers();
  }
}
  nextPage() {
    if (this.currentPage < this.metadata.lastPage) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }


generateVisiblePages() {
  this.visiblePages = [];
  const totalPages = this.metadata.lastPage || 1;
  for (let i = 1; i <= totalPages; i++) {
    this.visiblePages.push(i);
  }
}
}
