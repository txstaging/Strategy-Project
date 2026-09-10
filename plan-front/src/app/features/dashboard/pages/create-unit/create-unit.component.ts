import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateUserServiceService } from '../../services/create-user-service.service';
import { GeneralApiService } from '../../../../Core/Service/general-api.service';
import { ICreateUnit } from '../../interfaces/icreate-unit';

@Component({
  selector: 'app-create-unit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-unit.component.html',
  styleUrl: './create-unit.component.css',
})
export class CreateUnitComponent {
  constructor(
    private unit: GeneralApiService,
    private cdr: ChangeDetectorRef,
    private user: CreateUserServiceService
  ) {}

  createUnitForm = new FormGroup({
    UnitName: new FormControl('', [Validators.required]),
  });
  isSuccessPopupVisible = false;
  closeSuccessPopup(): void {
    this.isSuccessPopupVisible = false;
  }
  CreateUnit(): void {
    this.createUnitForm.markAllAsTouched();
    if (this.createUnitForm.invalid) {
      console.warn('❌ النموذج غير مكتمل أو يحتوي على أخطاء!');
      return;
    }
    const userData: ICreateUnit = {
      UnitName: this.createUnitForm.get('UnitName')?.value || '',
    };

    this.user.CreateUnit(userData).subscribe({
      next: () => {

        this.isSuccessPopupVisible = true;
      },
    });
  }
}
