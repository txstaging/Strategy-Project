import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-initiatives-confirmation-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './initiatives-confirmation-message.component.html',
  styleUrl: './initiatives-confirmation-message.component.css'
})
export class InitiativesConfirmationMessageComponent {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  closeModal() {
    this.closed.emit();
  }
}
