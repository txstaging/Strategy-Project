import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-comment-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div
      class="modal"
      [class.show]="isOpen"
      [style.display]="isOpen ? 'block' : 'none'"
      tabindex="-1"
    >
      <div class="modal-dialog" style="margin-top: 15%;">
        <div class="modal-content">
          <div class="modal-header" style="border: none;">
            <h5 class="modal-title">{{ getModalTitle() }}</h5>
            <button
              type="button"
              class="btn-close"
              (click)="closeModal()"
              style="position: absolute; left: 10px; top: 15px; font-size: 10px;"
            >
              &times;
            </button>
          </div>
          <div class="modal-body">
            <form [formGroup]="restoreForm" (ngSubmit)="onSubmit()">
              <div class="mb-3">
                <textarea
                  formControlName="reason"
                  class="form-control"
                  rows="3"
                  [placeholder]="getPlaceholderText()"
                >
                </textarea>
                @if (
                  restoreForm.get('reason')?.invalid &&
                  restoreForm.get('reason')?.touched
                ) {
                  <div class="text-danger mt-1">هذا الحقل مطلوب</div>
                }
              </div>
              <div class="text-center">
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="restoreForm.invalid"
                >
                  {{ getButtonText() }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    @if (isOpen) {
      <div class="modal-backdrop fade show"></div>
    }
  `,
})
export class CommentModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() reasonModalType: 'reject' | 'return' | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<string>();

  restoreForm = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(3)]],
  });

  constructor(private fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Reset form when the modal is opened
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.restoreForm.reset();
    }
  }

  getModalTitle(): string {
    return this.reasonModalType === 'return' ? 'استرجاع البند' : 'رفض البند';
  }

  getPlaceholderText(): string {
    return this.reasonModalType === 'return'
      ? 'اضافة سبب الاسترجاع'
      : 'اضافة سبب الرفض';
  }

  getButtonText(): string {
    return this.reasonModalType === 'return' ? 'استرجاع' : 'رفض';
  }

  closeModal() {
    this.restoreForm.reset();
    this.isOpen = false;
    this.closed.emit();
  }

  onSubmit() {
    if (this.restoreForm.valid) {
      this.submitted.emit(this.restoreForm.get('reason')?.value || '');
      this.restoreForm.reset();
      this.closeModal();
    } else {
      // Mark form controls as touched to trigger validation messages
      this.restoreForm.markAllAsTouched();
    }
  }
}
