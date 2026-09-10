import { ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { EditModalComponent } from "../../components/edit-modal/edit-modal.component";
import { GeneralApiService } from '../../../../Core/Service/general-api.service';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { saudiPhoneValidator } from '../../../../Core/utilities/saudi-phone-number-validator';
import { ICreateUser } from '../../interfaces/ICreateUserBody';
import { CreateUserServiceService } from '../../services/create-user-service.service';
import { IUpdateUser } from '../../interfaces/iupdate-user';
import { UserControllerServiceService } from '../../services/user-controller-service.service';
import { ActivatedRoute } from '@angular/router';
import { IGetUserById } from '../../interfaces/iget-user-by-id';

@Component({
  selector: 'app-update-user',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './update-user.component.html',
  styleUrl: './update-user.component.css'
})
export class UpdateUserComponent implements OnInit {
  constructor(
    private unit: GeneralApiService,
    private cdr: ChangeDetectorRef,
    private user: CreateUserServiceService,
    private userService: UserControllerServiceService,
    private activatedRoute: ActivatedRoute
  ) {}

  toastr = inject(ToastrService);
  data = signal<any[]>([]);
  RolesEnums = RolesEnums; // Make enum available to template
  isModalOpen = signal(false);
  isSubmitting = signal(false);
  userPermissions = signal<{ modulePermissions: Record<string, string[]> } | undefined>(undefined);

  createUserForm = new FormGroup({
    userName: new FormControl(),
    email: new FormControl(),
    unitId: new FormControl(),
    password: new FormControl(''),  // كلمة المرور اختيارية في التحديث
    role: new FormControl(),
    phoneNumber: new FormControl(),
    rank: new FormControl(),
    department: new FormControl(),
    administration: new FormControl(),
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

  handlePermissionsSave(permissions: { modulePermissions: Record<string, string[]> }): void {
    this.userPermissions.set(permissions);
  }

  createuser(): void {
    this.createUserForm.markAllAsTouched();

   

    this.isSubmitting.set(true);

    const formValues = this.createUserForm.value;
    const userId = this.activatedRoute.snapshot.paramMap.get('id');

    const userData: IUpdateUser = {
      userName: formValues.userName || '',
      email: formValues.email || '',
      unitId: formValues.unitId || '',
      password: formValues.password || '',  // في حال ترك الحقل فارغ لا يتم تحديث كلمة المرور من السيرفر (حسب منطقك)
      role: formValues.role || '',
      phoneNumber: formValues.phoneNumber || '',
    
      UserId: Number(userId ?? 0),
    };
    console.log(userData.unitId)

    this.user.UpdateUser(userData).subscribe({
      next: () => {
        this.toastr.success(' ', 'تم تحديث الحساب بنجاح');
        this.createUserForm.reset();
        this.userPermissions.set(undefined);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(
          err.error?.message || 'حدث خطأ أثناء تحديث المستخدم',
          'خطأ'
        );
        this.isSubmitting.set(false);
      },
    });
  }

  userData: IGetUserById | null = null;
  error: string | null = null;

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

    const userId = this.activatedRoute.snapshot.paramMap.get('id');

    if (userId !== null) {
      this.userService.getUser(Number.parseInt(userId)).subscribe({
        next: (data) => {
          this.userData = data;
          this.userData.passwordV2="888888888"

          this.createUserForm.patchValue({
            userName: data.displayName,
            email: data.email,
            
            role: data.role,
            unitId:data.unitName,
            password:data.passwordV2,

           
           
           
            
          });

         

          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'حدث خطأ في جلب بيانات المستخدم';
          console.error(err);
        }
      });
    }
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
      if (controlName === 'phoneNumber') return 'يجب أن يحتوي رقم الهاتف على أرقام فقط';
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
