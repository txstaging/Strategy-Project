import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InitiativesItemFormComponent } from '../initiatives-item-form/initiatives-item-form.component';


@Component({
  selector: 'app-initiatives-item-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InitiativesItemFormComponent],  templateUrl: './initiatives-item-edit-modal.component.html',
  styleUrl: './initiatives-item-edit-modal.component.css'
})
export class InitiativesItemEditModalComponent implements OnInit  {
  @Input() isOpen = false;
  @Input() initiativeData: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<any>();
  @Input() initiativeId!: number;
  @Input() planId!: number;

  initiativeForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.initiativeForm = this.fb.group({
      initiative: ['', Validators.required],
      kpis: this.fb.array([
        this.fb.control('', Validators.required),
        this.fb.control('', Validators.required),
        this.fb.control('', Validators.required),
      ]),
      objective: ['', Validators.required],
      responsible: ['', Validators.required],
      executionPartners: ['', Validators.required],
      executionObstacles: [''],
    });
  }

  ngOnInit() {
    if (this.initiativeData) {
      this.initiativeForm.patchValue({
        initiative: this.initiativeData.initiative,
        objective: this.initiativeData.objective,
        responsible: this.initiativeData.responsible,
        executionPartners: this.initiativeData.executionPartners,
        executionObstacles: this.initiativeData.executionObstacles,
      });
    }
  }

  onSubmit() {
    this.initiativeForm.markAllAsTouched();
    if (this.initiativeForm.valid) {
      this.submitted.emit(this.initiativeForm.value);
      this.closeModal.emit();
    }
  }

  onClose() {
    this.closeModal.emit();
  }

  onFormSubmitted() {
    this.closeModal.emit();
  }
}
