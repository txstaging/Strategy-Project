import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-objectives-stage-empty',
  standalone: true,
  imports: [],
  templateUrl: './objectives-stage-empty.component.html',
  styleUrl: './objectives-stage-empty.component.css'
})
export class ObjectivesStageEmptyComponent {
  @Output() openModal = new EventEmitter<void>();

  handleOpenModal() {
    this.openModal.emit();
  }
}
