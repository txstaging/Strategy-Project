import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {
  @Input() title = 'تأكيد العملية';
  @Input() message = 'هل أنت متأكد من رغبتك في إتمام هذه العملية؟';
  @Input() confirmText = 'تأكيد';
  @Input() cancelText = 'إلغاء';
  @Input() isVisible = false;
  @Input() dangerMode = true;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
    this.closeDialog();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.closeDialog();
  }

  closeDialog(): void {
    // Ensures dialog closes properly
    this.isVisible = false;
  }

  stopPropagation(event: MouseEvent): void {
    // Prevents click events from bubbling up
    event.stopPropagation();
  }
}
