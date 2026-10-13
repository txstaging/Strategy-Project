import {
  ChangeDetectorRef,
  Component,
  computed,
  EventEmitter,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InitiativesService } from '../../services/initiatives.service';
import { InitiativesStageHomeComponent } from '../../pages/initiatives-stage-home/initiatives-stage-home.component';
import { IUpdateInitiativesBody } from '../../interfaces/IUpdateInitiativesBody';
import { IAddInitiativesBody } from '../../interfaces/IAddInitiativesBody';
import { IGetInitiativesById } from '../../interfaces/IGetInitiativesById';
import { InitiativeItemType } from '../../interfaces/IinitiativeItemEnum';
import {
  RejectionStatuses,
  ReturnedStatuses,
} from '../../../../Core/utilities/consts';

@Component({
  selector: 'app-initiatives-item-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './initiatives-item-form.component.html',
  styleUrl: './initiatives-item-form.component.css',
})
export class InitiativesItemFormComponent implements OnInit {
  @Input() planId: any;
  @Input() isModal = false;
  @Input() isEdit = false;
  @Input() initiativeId: number | null = null;

  @Output() closeModalEvent = new EventEmitter<void>();

  @Output() isSubmit = new EventEmitter<boolean>();
  @Output() formSubmitted = new EventEmitter<void>();
  private submitted = signal(false);
  readonly hasSubmitted = computed(() => this.submitted());

  @Input() set goalId(value: number | null) {
    if (value !== null && value !== 0) {
      this.initiativeForm.patchValue({
        goalId: value,
      });
    } else {
      console.log('Invalid goalId provided:', value);
    }
  }
  details: any;

  // Initiative item type options with Arabic labels
  initiativeItemTypes = [
    { value: InitiativeItemType.AdminInCharge, label: 'المسؤول عن المبادرة' },
    { value: InitiativeItemType.Partner, label: 'شركاء التنفيذ للمبادرة' },
    { value: InitiativeItemType.Obstacle, label: 'معوقات التنفيذ' },
  ];

  // Update the form structure to include dynamic elements
  initiativeForm = this.fb.group({
    goalId: [0, Validators.required],
    name: ['', Validators.required],
    initiativeWeight: [1, [Validators.required, Validators.min(1)]],
    initiativeKPIs: this.fb.array([]),
    initiativeItem: this.fb.array([]),
  });

  constructor(
    private fb: FormBuilder,
    private initiativesService: InitiativesService,
    private changeDetectorRef: ChangeDetectorRef,
    private initiativesComponent: InitiativesStageHomeComponent
  ) {}

  ngOnInit() {
    // Initialize with default KPIs and items if not editing
    if (!this.isEdit) {
      this.addKPI();
      this.addInitiativeItem();
    }

    if (this.isEdit && this.initiativeId) {
      this.loadInitiativeData();
    }
  }

  loadInitiativeData() {
    if (this.initiativeId) {
      this.initiativesService.getInitiativeById(this.initiativeId).subscribe({
        next: (initiative: IGetInitiativesById) => {
          this.details = initiative;

          // Set main form values with the new structure
          const formData = {
            goalId: initiative.goal?.id || 0,
            name: initiative.name?.value || '',
            // The API does return the weight; this used to be hardcoded to 1,
            // so reopening an initiative silently reset whatever weight the
            // employee had entered.
            initiativeWeight: initiative.initiativeWeight ?? 1,
          };

          console.log('Form data to patch:', formData);
          this.initiativeForm.patchValue(formData);

          // Clear and populate KPIs
          const kpisArray = this.initiativeForm.get(
            'initiativeKPIs'
          ) as FormArray;
          kpisArray.clear();

          if (
            initiative.initiativeKPIs &&
            initiative.initiativeKPIs.length > 0
          ) {
            initiative.initiativeKPIs.forEach((kpi: any) => {
              console.log('Adding KPI:', kpi);
              kpisArray.push(
                this.fb.group({
                  id: kpi.id,
                  value: kpi.value,
                  status: kpi.status,
                  comment: kpi.comment,
                })
              );
            });
          } else {
            // Add default KPI if none exist
            this.addKPI();
          }

          // Clear and populate initiative items
          const itemsArray = this.initiativeForm.get(
            'initiativeItem'
          ) as FormArray;
          itemsArray.clear();

          if (
            initiative.initiativeItem &&
            initiative.initiativeItem.length > 0
          ) {
            initiative.initiativeItem.forEach((item: any) => {
              console.log('Adding initiative item:', item);
              itemsArray.push(
                this.fb.group({
                  id: item.id,
                  value: item.value,
                  type: item.type,
                  status: item.status,
                  comment: item.comment,
                })
              );
            });
          } else {
            // Add default item if none exist
            this.addInitiativeItem();
          }

          console.log('Form after patching:', this.initiativeForm.value);
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('Error loading initiative data:', error);
        },
      });
    }
  }

  /**
   * Helper methods for form arrays
   */
  get kpis() {
    return this.initiativeForm.get('initiativeKPIs') as FormArray;
  }

  get items() {
    return this.initiativeForm.get('initiativeItem') as FormArray;
  }

  addKPI() {
    const kpiGroup = this.fb.group({
      id: [null],
      value: ['', Validators.required],
      status: ['Pending'],
      comment: [null],
    });
    this.kpis.push(kpiGroup);
  }

  removeKPI(index: number) {
    if (this.kpis.length > 1) {
      this.kpis.removeAt(index);
    }
  }

  addInitiativeItem() {
    const itemGroup = this.fb.group({
      id: [null],
      value: ['', Validators.required],
      type: [InitiativeItemType.AdminInCharge, Validators.required],
      status: ['Pending'],
      comment: [null],
    });
    this.items.push(itemGroup);
  }

  removeInitiativeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  /**
   * Whether a manager rejected or returned this element. The edit form used to
   * show every element the same way, so after a return the employee could not
   * tell which ones had been refused or why.
   */
  isSentBack(status: string | null | undefined): boolean {
    return (
      ReturnedStatuses.includes(status as any) ||
      RejectionStatuses.includes(status as any)
    );
  }

  // The note shown under an element that was sent back, with the reason.
  sentBackNote(status: string | null | undefined, comment: string | null | undefined): string {
    const what = RejectionStatuses.includes(status as any)
      ? 'تم رفض هذا العنصر'
      : 'تمت إعادة هذا العنصر';
    return comment
      ? `${what} ويحتاج إلى تعديل: ${comment}`
      : `${what} ويحتاج إلى تعديل`;
  }

  hasElementsToEdit(): boolean {
    if (!this.isEdit) return false;
    if (this.isSentBack(this.details?.name?.status)) return true;
    return [...this.kpis.controls, ...this.items.controls].some((control) =>
      this.isSentBack(control.get('status')?.value)
    );
  }

  getInitiativeItemTypeLabel(type: number): string {
    const itemType = this.initiativeItemTypes.find((t) => t.value === type);
    return itemType ? itemType.label : 'غير محدد';
  }

  closeModal(): void {
    // This method is called from the parent component
    // The actual modal closing logic is handled by the parent
    this.closeModalEvent.emit();
  }

  convertFormToPayload() {
    if (this.isEdit && this.initiativeId) {
      return this.createUpdatePayload();
    } else {
      return this.createAddPayload();
    }
  }

  private createUpdatePayload(): IUpdateInitiativesBody {
    const formValues = this.initiativeForm.value;

    return {
      id: this.initiativeId!,
      status: this.details?.status || 'Pending',
      comment: this.details?.comment || '',
      goalId: formValues.goalId || 0,
      name: {
        id: this.details?.name?.id || 0,
        value: formValues.name || '',
        status: this.details?.name?.status || 'Pending',
        comment: this.details?.name?.comment || '',
      },
      initiativeItem:
        formValues.initiativeItem?.map((item: any) => ({
          id: item.id || 0,
          value: item.value || '',
          status: item.status || 'Pending',
          comment: item.comment || '',
          type: Number(item.type) || 1,
        })) || [],
      initiativeKPIs:
        formValues.initiativeKPIs?.map((kpi: any) => ({
          id: kpi.id || 0,
          value: kpi.value || '',
          status: kpi.status || 'Pending',
          comment: kpi.comment || '',
        })) || [],
    };
  }

  private createAddPayload(): IAddInitiativesBody {
    const formValues = this.initiativeForm.value;

    return {
      goalId: formValues.goalId || 0,
      name: formValues.name || '',
      initiativeWeight: formValues.initiativeWeight || 1,
      initiativeItem:
        formValues.initiativeItem?.map((item: any) => ({
          value: item.value || '',
          type: Number(item.type) || 1,
        })) || [],
      initiativeKPIs:
        formValues.initiativeKPIs?.map((kpi: any) => ({
          value: kpi.value || '',
        })) || [],
    };
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    console.log('Form submission started');
    console.log('Plan ID:', this.planId);
    console.log('Goal ID:', this.initiativeForm.get('goalId')?.value);
    console.log('Form valid:', this.initiativeForm.valid);
    console.log('Form values:', this.initiativeForm.value);
    console.log('Form errors:', this.getFormErrors());

    this.initiativeForm.markAllAsTouched();
    if (this.initiativeForm.valid) {
      if (this.isEdit && this.initiativeId) {
        console.log('Updating existing initiative');
        const updatePayload = this.createUpdatePayload();
        console.log('Update payload:', updatePayload);
        this.initiativesService.updateInitiative(updatePayload).subscribe({
          next: () => {
            console.log('Initiative updated successfully');
            this.submitted.set(true);
            this.isSubmit.emit(true);
            this.initiativesComponent.loadInitiatives();
            this.changeDetectorRef.detectChanges();
            this.formSubmitted.emit(); // Notify parent component
          },
          error: (error) => {
            console.error('Error updating initiative', error);
          },
        });
      } else {
        const createPayload = this.createAddPayload();

        this.initiativesService
          .createInitiative(this.planId, createPayload)
          .subscribe({
            next: () => {
              this.submitted.set(true);
              this.isSubmit.emit(true);
              this.initiativesComponent.loadInitiatives();
              this.changeDetectorRef.detectChanges();
              this.formSubmitted.emit(); // Notify parent component
            },
            error: (error) => {
              console.error('Error creating initiative', error);
              console.error('Error details:', error.error);
            },
          });
      }
    } else {
      console.log('Form errors:', this.getFormErrors());
    }
  }

  private getFormErrors() {
    const formErrors: any = {};

    Object.keys(this.initiativeForm.controls).forEach((key) => {
      const controlErrors = this.initiativeForm.get(key)?.errors;
      if (controlErrors) {
        formErrors[key] = controlErrors;
      }
    });

    return formErrors;
  }
}
