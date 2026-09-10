import { GetAllUnitServiceService } from './../../services/get-all-units-service.service';
import { NgFor } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MetaDataDto } from '../../interfaces/iget-all-users';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unit-controller',
  standalone: true,
  imports: [NgFor,RouterLink],
  templateUrl: './unit-controller.component.html',
  styleUrl: './unit-controller.component.css'
})
export class UnitControllerComponent implements OnInit {
  isSubmitting: any;
  toastr: any;
  constructor(private unit:GetAllUnitServiceService){}
  
  ngOnInit(): void {
      this.loadUsers()
  }
  metadata!: MetaDataDto;
    currentPage: number = 1;
   
   perPage: number = 5;
isHighManagement = signal(true);
totalPages = 20; // عدد الصفحات الكلي
pages: number[] = [];
visiblePages: number[] = [];
;
  userService: any;
  users: any;
generatePages() {
  this.pages = [];
  for (let i = 1; i <= this.totalPages; i++) {
    this.pages.push(i);
  }
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
loadUsers() {
  this.unit.getAllUsers(this.perPage, this.currentPage).subscribe(response => {
    this.users = response.data;
    this.metadata = response.metadata;
    this.generateVisiblePages();
  });
}



generateVisiblePages() {
  this.visiblePages = [];
  const totalPages = this.metadata.lastPage || 1;
  for (let i = 1; i <= totalPages; i++) {
    this.visiblePages.push(i);
  }
}

delete(id:number)
{
  this.unit.delete(id).subscribe({
     next: (res) => {
  console.log('وصل الـ next');
  alert('تم الحذف بنجاح');
          this.isSubmitting.set(false);

  this.toastr.success('تم الحذف', 'نجاح');
  
},
  })
}
}
