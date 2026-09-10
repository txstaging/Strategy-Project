
import { PopupComponent } from './../../../../shared/components/popup/popup.component';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AnalysisTypes } from '../../../../Core/utilities/global.type';
import { AnalysisStageService } from '../../services/analysis-stage.service';
import { SavePopupComponent } from '../../../../save-popup/save-popup.component';


@Component({
  selector: 'app-analysis-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, SavePopupComponent],
  templateUrl: './analysis-form.component.html',
  styleUrl: './analysis-form.component.css'
})
export class AnalysisFormComponent implements OnInit {
  @Input() mode: 'create' | 'edit' | 'view' | null = null;
  @Input() data?: any;
  @Input() planId!: string;
  @Input() type!: AnalysisTypes;
  @Input() title!: string;
  @Output() formClosed = new EventEmitter<boolean>(false);
  showModal = false;

  closePopup() {
    this.formClosed.emit();
  }
  constructor(private analysisStageService: AnalysisStageService) {}

  threatForm = new FormGroup({
    name: new FormControl('', Validators.required),
    procedures: new FormControl('', Validators.required),
    impact: new FormControl('', [Validators.required, Validators.min(0), Validators.max(10)]),
    degreeOfCertainty: new FormControl('', [Validators.required, Validators.min(0), Validators.max(10)]),
  });

  ngOnInit() {
    if ((this.mode === 'edit' || this.mode === 'view') && this.data) {
      this.threatForm.patchValue(this.data);
    }
  }

  onSubmit() {
    this.threatForm.markAllAsTouched();
    if (this.threatForm.valid) {
      if (this.mode === 'create') {
        this.analysisStageService
          .createAnalysisPoint({
            planId: this.planId,
            type: this.type,
            ...this.threatForm.value,
          })
          .subscribe({
            next: () => this.formClosed.emit(true),
            
            
            

            
          });
      } else {
        this.analysisStageService
          .updateAnalysisPoint({
            id: this.data.id,
            planId: this.planId,
            type: this.type,
            ...this.threatForm.value,
          })
          .subscribe({
            next: () => this.formClosed.emit(true) ,
          });
      }
    }
  }
  onDestroy(): void {
    this.formClosed.emit(false);
  }
}
