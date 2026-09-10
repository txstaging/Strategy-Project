import { GetAllUnitServiceService } from './../../services/get-all-units-service.service';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ICreateUnit } from '../../interfaces/icreate-unit';
import { ActivatedRoute } from '@angular/router';
import { IUpdateUnit } from '../../interfaces/iget-all-units';

@Component({
  selector: 'app-update-unit',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './update-unit.component.html',
  styleUrl: './update-unit.component.css'
})
export class UpdateUnitComponent {
  toastr: any;
  createUserForm: any;
  userPermissions: any;
  isSubmitting: any;

  constructor(private unit:GetAllUnitServiceService,    private activatedRoute: ActivatedRoute
  ){}
    

   ngOnInit(): void {
  this.toastr.success('نجح الاختبار', 'توستر شغال؟');
}

  createUnitForm = new FormGroup({
      UnitName: new FormControl('', [Validators.required]),
    });
    isSuccessPopupVisible = false;
   
    closeSuccessPopup(): void {
      this.isSuccessPopupVisible = false;
    }
    CreateUnit(): void {
    const  unitId = Number.parseInt(this.activatedRoute.snapshot.paramMap.get('id') || '0', 10);
    const  formValues = this.createUnitForm.value;

      const unit: IUpdateUnit = {
        id:unitId,
        name:formValues.UnitName|| ""
           
          };
          this.unit.UpdateUser(unit).subscribe({
         next: (res) => {
  console.log('وصل الـ next');
  alert('تم التحديث بنجاح');
          this.isSubmitting.set(false);

  this.toastr.success('تم التحديث', 'نجاح');
},
      error: (err) => {
        console.error(err);
        this.toastr.error(
          err.error?.message || 'حدث خطأ أثناء تحديث  الوحدة',
          'خطأ'
        );
        this.isSubmitting.set(false);
      },
          })



     
    }

}
