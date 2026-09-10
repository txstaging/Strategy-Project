import { ActivatedRoute, Route } from '@angular/router';
import { IGetUserById } from './../../interfaces/iget-user-by-id';
import { ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ICreateUser } from '../../interfaces/ICreateUserBody';
import { GeneralApiService } from '../../../../Core/Service/general-api.service';
import { CreateUserServiceService } from '../../services/create-user-service.service';
import { ToastrService } from 'ngx-toastr';
import { RolesEnums } from '../../../../Core/utilities/consts';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { saudiPhoneValidator } from '../../../../Core/utilities/saudi-phone-number-validator';
import { EditModalComponent } from "../../components/edit-modal/edit-modal.component";
import { ReactiveFormsModule } from '@angular/forms';
import { UserControllerServiceService } from '../../services/user-controller-service.service';


@Component({
  selector: 'app-user-data-view',
  standalone: true,
  imports: [EditModalComponent],
  templateUrl: './user-data-view.component.html',
  styleUrl: './user-data-view.component.css'
})
export class UserDataViewComponent implements OnInit {
 constructor(
    private user: CreateUserServiceService,private userService: UserControllerServiceService,private activatedRoute: ActivatedRoute ) {}

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
    phoneNumber: new FormControl('', [
      Validators.required,
      Validators.pattern('^[0-9+]+$'),
      saudiPhoneValidator,
    ]),
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


userData: IGetUserById | null = null;
  error: string | null = null;
 ngOnInit() {
  const userId = this.activatedRoute.snapshot.paramMap.get('id');

  if (userId !== null) {
    this.userService.getUser(Number.parseInt(userId)).subscribe({
      next: (data) => {
        this.userData = data;
      },
      error: (err) => {
        this.error = 'حدث خطأ في جلب بيانات المستخدم';
        console.error(err);
      }
    });
  } else {
    this.error = 'رقم المستخدم غير متوفر في الرابط';
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
