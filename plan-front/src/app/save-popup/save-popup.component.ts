import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-save-popup',
  standalone: true,
  imports: [NgIf],
  templateUrl: './save-popup.component.html',
  styleUrl: './save-popup.component.css'
})
export class SavePopupComponent {
  @Input() title: string = '';
  @Input() isOpen: boolean = false;

  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

}
