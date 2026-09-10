import {
  ChangeDetectorRef,
  Component,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralApiService } from '../../../../Core/Service/general-api.service';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CreateUserServiceService } from '../../services/create-user-service.service';
import { ToastrService } from 'ngx-toastr';
import { inject } from '@angular/core';
import { EditModalComponent } from '../../components/edit-modal/edit-modal.component';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { ICreateUser } from '../../interfaces/ICreateUserBody';
import { passwordStrengthValidator } from '../../../../Core/utilities/password-sterngth-validator';
import { saudiPhoneValidator } from '../../../../Core/utilities/saudi-phone-number-validator';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EditModalComponent],
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.css',
})
export class CreateUserComponent implements OnInit {
  constructor(
    private unit: GeneralApiService,
    private cdr: ChangeDetectorRef,
    private user: CreateUserServiceService
  ) {}

  toastr = inject(ToastrService);
  data = signal<any[]>([]);
  RolesEnums = RolesEnums; // Make enum available to template
  isModalOpen = signal(false);
  isSubmitting = signal(false);
  userPermissions = signal<
    { modulePermissions: Record<string, string[]> } | undefined
  >(undefined);

  createUserForm = new FormGroup({
    userName: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
    ]),
    email: new FormControl('', [
      Validators.required,
      Validators.email,
      Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'),
    ]),
    unitId: new FormControl('', [Validators.required]),
    // password: new FormControl('', [
    //   Validators.required,
    //   Validators.minLength(8),
    //   passwordStrengthValidator,
    // ]),
    password: new FormControl(''),
    role: new FormControl('', [Validators.required]),
    phoneNumber: new FormControl(),
   
    rank: new FormControl(''),
    department: new FormControl(''),
    administration: new FormControl(''),
  });

  // Computed values for form state
  formValid = computed(() => this.createUserForm.valid);
  hasPermissions = computed(() => !!this.userPermissions());

  openPermissionsModal(): void {
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  handlePermissionsSave(permissions: {
    modulePermissions: Record<string, string[]>;
  }): void {
    this.userPermissions.set(permissions);
  }

  isRoleWithAutoPermissions(): boolean {
    const role = this.createUserForm.get('role')?.value;
    return role === RolesEnums.HighManagement || role === 'Admin';
  }

  // Roles that sit above units don't belong to a specific unit.
  isRoleAboveUnit(): boolean {
    const role = this.createUserForm.get('role')?.value;
    return (
      role === RolesEnums.RegionManager ||
      role === RolesEnums.HighManagement ||
      role === 'Admin'
    );
  }

  createuser(): void {
    this.createUserForm.markAllAsTouched();

    if (this.createUserForm.invalid) {
      this.toastr.error(' ', 'النموذج غير مكتمل أو يحتوي على أخطاء');
      return;
    }

    if (!this.isRoleWithAutoPermissions() && !this.userPermissions()) {
      this.toastr.warning(' ', 'الرجاء تعيين الصلاحيات قبل إنشاء المستخدم');
      return;
    }

    this.isSubmitting.set(true);

    // Extract form values and ensure they're not null
    const formValues = this.createUserForm.value;
    const phoneNumber = String(formValues.phoneNumber ?? '');
    const UnitStr = String(formValues.unitId || '');
    const UnitDigitsOnly = UnitStr.replace(/\D/g, '');
    const unit = parseInt(UnitDigitsOnly, 10) || 0;

    const userData: ICreateUser = {
      userName: formValues.userName || '',
      email: formValues.email || '',
      // RegionManager / HighManagement / Admin are not tied to a specific unit.
      unitId: this.isRoleAboveUnit() ? null : unit,
      password: formValues.password || '',
      role: formValues.role || '',
      phoneNumber: phoneNumber ,
      rank: formValues.rank || '',
      department: formValues.department || '',
      administration: formValues.administration || '',
      modulePermissions: this.isRoleWithAutoPermissions() ? {} : (this.userPermissions()?.modulePermissions || {}),
    };

    this.user.CreateUser(userData).subscribe({
      next: (res) => {
        if(res.message=="User Email Is Alredy Exist")
        {
          this.toastr.error(' ', 'البريد الألكترونى موجود مسبقا');
        }
        else{
          this.toastr.success(' ', 'تم انشاء الحساب بنجاح');
          this.createUserForm.reset();
          this.userPermissions.set(undefined);
        }
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(
          err.error?.message || 'حدث خطأ أثناء إنشاء المستخدم',
          'خطأ'
        );
        this.isSubmitting.set(false);
      },
    });
  }

  ngOnInit(): void {
    this.unit.getUnits().subscribe({
      next: (res) => {
        this.data.set(Array.isArray(res) ? res : res.data || []);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching units:', err);
        this.toastr.error('فشل في تحميل الوحدات', 'خطأ');
      },
    });

    // Switch unitId between required and optional based on the selected role.
    this.createUserForm.get('role')?.valueChanges.subscribe((role) => {
      const unitCtrl = this.createUserForm.get('unitId');
      if (!unitCtrl) return;
      const aboveUnit =
        role === RolesEnums.RegionManager ||
        role === RolesEnums.HighManagement ||
        role === 'Admin';
      if (aboveUnit) {
        unitCtrl.clearValidators();
        unitCtrl.setValue('');
      } else {
        unitCtrl.setValidators([Validators.required]);
      }
      unitCtrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  // Helper methods for template access
  getErrorMessage(controlName: string): string {
    const control = this.createUserForm.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) return 'هذا الحقل مطلوب';
    if (control.hasError('email')) return 'البريد الإلكتروني غير صالح';
    if (control.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `يجب أن يحتوي هذا الحقل على ${minLength} أحرف على الأقل`;
    }
    if (control.hasError('pattern')) {
      if (controlName === 'phoneNumber')
        return 'يجب أن يحتوي رقم الهاتف على أرقام فقط';
      if (controlName === 'email') return 'صيغة البريد الإلكتروني غير صحيحة';
      return 'القيمة المدخلة غير صالحة';
    }
    if (control.hasError('weakPassword'))
      return 'كلمة المرور ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل وتتضمن أحرف كبيرة وصغيرة وأرقام ورموز خاصة';
    if (control.hasError('invalidSaudiPhone'))
      return 'رقم الهاتف غير صالح. يجب أن يبدأ بـ 05 أو +9665 ويتكون من 10 أرقام';

    return '';
  }
}
