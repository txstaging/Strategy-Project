import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { StrategicPlanService } from '../../services/strategic-plan.service';

@Component({
  selector: 'app-strategic-plans-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './strategic-plans-form.component.html',
  styleUrl: './strategic-plans-form.component.css',
})
export class StrategicPlansFormComponent implements OnChanges {
  @Input() isVisible = false;
  @Input() isView = false;
  @Input() editData: any = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formSubmitComplete = new EventEmitter<void>();

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private strategicPlanService: StrategicPlanService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
    });
  }

  ngOnChanges() {
    if (this.editData) {
      this.form.patchValue({
        name: this.editData.name,
      });
    }
  }

  closeCreatePopup() {
    this.form.reset();
    this.closeModal.emit();
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.valid) {
      const formData = this.form.value;

      if (this.editData) {
        this.strategicPlanService
          .updatePlan({
            id: this.editData.id,
            ...formData,
          })
          .subscribe({
            next: (response) => {
              this.formSubmit.emit(response);
              this.formSubmitComplete.emit();
              this.closeCreatePopup();
            },
          });
      } else {
        this.strategicPlanService.createPlan(formData).subscribe({
          next: (response) => {
            this.formSubmit.emit(response);
            this.formSubmitComplete.emit();
            this.closeCreatePopup();
          },
        });
      }
    }
  }
}
