import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PlanProjectsService } from '../../services/plan-projects.service';
import { IGetProjectByIdResponse } from '../../interfaces/IGetProjectById';
import { IUpdateProjectBody } from '../../interfaces/IUpdateProjectBody';
import {
  RejectionStatuses,
  ReturnedStatuses,
} from '../../../../Core/utilities/consts';
import {
  endNotBeforeStart,
  notBeforeToday,
  todayIso,
} from '../../../../Core/utilities/date-rules';
import { IGetAcceptableInitiativesResponse } from '../../interfaces/IGetAcceptableInitiativesResponse';

// A date as the yyyy-MM-dd an <input type="date"> needs, or '' if unreadable.
//
// The API sends startDate/endDate through DateOnly.ToString(), whose shape
// depends on the server's culture (30/09/2026, 9/30/2026, …). Handing that to
// new Date() gave Invalid Date for day-first values, so the edit form opened
// with both dates blank. Parsed by hand instead, and without new Date(), which
// also shifted yyyy-MM-dd strings by a day in timezones west of UTC.
function toIsoDate(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  const text = String(raw).trim();
  const pad = (n: number) => String(n).padStart(2, '0');
  const valid = (y: number, m: number, d: number) =>
    y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31;

  // yyyy-MM-dd or yyyy/MM/dd, optionally followed by a time.
  let m = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    const [y, mo, d] = [+m[1], +m[2], +m[3]];
    return valid(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : '';
  }

  // dd/MM/yyyy or MM/dd/yyyy. Whichever part is over 12 must be the day;
  // when both could be, month-first matches how new Date() read it before.
  m = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (m) {
    const [a, b, y] = [+m[1], +m[2], +m[3]];
    const [mo, d] = a > 12 ? [b, a] : [a, b];
    return valid(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : '';
  }

  return '';
}

// Which approvable item in the project details backs each form control.
const REVIEWED_FIELDS: Record<string, string> = {
  name: 'name',
  priority: 'priority',
  duration: 'duration',
  beneficiaries: 'beneficiaries',
  supervisingAuthority: 'supervisingAuthority',
  weight: 'weight',
  startDate: 'startDateItem',
  endDate: 'endDateItem',
};

@Component({
  selector: 'app-project-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './project-edit-modal.component.html',
  styleUrl: './project-edit-modal.component.css',
})
export class ProjectEditModalComponent implements OnInit {
  @Input() projectDetails!: IGetProjectByIdResponse;
  @Input() planId!: string;
  @Output() closeModal = new EventEmitter<void>();
  @Output() projectUpdated = new EventEmitter<void>();

  private readonly planProjectsService = inject(PlanProjectsService);

  readonly submitting = signal(false);

  // Earliest date the date pickers offer for a changed date.
  readonly today = todayIso();

  // The dates the project already had. Keeping them is allowed even after
  // they have passed; changing them to a past date is not.
  private originalStartDate: string | null = null;
  private originalEndDate: string | null = null;

  // Initiatives the project can be filed under. The edit form used to have no
  // way to change the initiative, so a project added under the wrong one could
  // only be deleted and added again.
  initiatives: IGetAcceptableInitiativesResponse[] = [];

  readonly projectForm = new FormGroup({
    id: new FormControl<number>(0, [Validators.required]),
    name: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(3),
    ]),
    priority: new FormControl<string>('', [Validators.required]),
    duration: new FormControl<string>('', [Validators.required]),
    beneficiaries: new FormControl<string>('', [Validators.required]),
    supervisingAuthority: new FormControl<string>('', [Validators.required]),
    weight: new FormControl<string>('', [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
    ]),
    code: new FormControl<string>('', [Validators.required]),
    planInitiativeId: new FormControl<number>(0, [Validators.required]),
    planGoalsId: new FormControl<number>(0, [Validators.required]),
    startDate: new FormControl<string>('', [
      Validators.required,
      notBeforeToday(() => this.originalStartDate),
    ]),
    endDate: new FormControl<string>('', [
      Validators.required,
      notBeforeToday(() => this.originalEndDate),
    ]),
  }, { validators: endNotBeforeStart() });

  ngOnInit() {
    if (this.projectDetails) {
      // Helper function to safely get value from either flat or nested structure
      const getValue = (field: any): string => {
        if (!field) return '';
        // If it's a nested object with 'value' property, return field.value
        if (typeof field === 'object' && field.value !== undefined) {
          return field.value;
        }
        // If it's a direct value, return it
        return field.toString();
      };

      // Helper function specifically for getting IDs with fallback to nested objects
      const getIdValue = (directId: any, nestedObject: any): number => {
        // If we have a direct ID value and it's not null, use it
        if (directId !== null && directId !== undefined) {
          return Number(directId) || 0;
        }
        // Fallback to nested object ID if direct ID is null/undefined
        if (nestedObject && nestedObject.id !== undefined) {
          return Number(nestedObject.id) || 0;
        }
        return 0;
      };

      // Helper function to format dates to yyyy-MM-dd format
      const formatDateForApi = (dateString: string): string => {
        const iso = toIsoDate(dateString);
        if (dateString && !iso) {
          console.warn('Invalid date received:', dateString);
        }
        return iso;
      };

      this.projectForm.patchValue({
        id: this.projectDetails.id,
        name: getValue(this.projectDetails.name),
        priority: getValue(this.projectDetails.priority),
        duration: getValue(this.projectDetails.duration),
        beneficiaries: getValue(this.projectDetails.beneficiaries),
        supervisingAuthority: getValue(
          this.projectDetails.supervisingAuthority
        ),
        weight: getValue(this.projectDetails.weight),
        code: getValue(this.projectDetails.code),
        planInitiativeId: getIdValue(
          this.projectDetails.planInitiativeId,
          this.projectDetails.planInitiative
        ),
        planGoalsId: getIdValue(
          this.projectDetails.planGoalsId,
          this.projectDetails.planGoals
        ),
        startDate:
          toIsoDate((this.projectDetails as any).startDateItem?.value) ||
          formatDateForApi(this.projectDetails.startDate),
        endDate:
          toIsoDate((this.projectDetails as any).endDateItem?.value) ||
          formatDateForApi(this.projectDetails.endDate),
      });
      this.originalStartDate = this.projectForm.value.startDate || null;
      this.originalEndDate = this.projectForm.value.endDate || null;
      // Re-run the date checks now that the original dates are known, so dates
      // the project already had are not flagged as being in the past.
      this.projectForm.get('startDate')?.updateValueAndValidity();
      this.projectForm.get('endDate')?.updateValueAndValidity();
      this.loadInitiatives();
    }
  }

  close() {
    this.closeModal.emit();
  }

  private loadInitiatives(): void {
    if (!this.planId) return;
    this.planProjectsService.getAcceptableInitiative(this.planId).subscribe({
      next: (list) => {
        const initiatives = [...(list || [])];
        // Keep the project's current initiative selectable even if it is not
        // in the approved list, so opening the form never changes it silently.
        const current = (this.projectDetails as any)?.planInitiative;
        const currentId = Number(this.projectForm.value.planInitiativeId);
        if (currentId && !initiatives.some((i) => i.id === currentId)) {
          initiatives.unshift({
            id: currentId,
            name: current?.value ?? current?.name ?? 'المبادرة الحالية',
            initiativeWeight: 0,
          });
        }
        this.initiatives = initiatives;
      },
    });
  }

  /**
   * Whether a manager rejected or returned this field. The employee used to get
   * the edit form with nothing marking which fields had been refused, so they
   * had to guess what to change.
   */
  needsEdit(control: string): boolean {
    const status = this.reviewedItem(control)?.status;
    return ReturnedStatuses.includes(status) || RejectionStatuses.includes(status);
  }

  // The note shown under a field that was sent back, with the manager's reason.
  reviewNote(control: string): string {
    const item = this.reviewedItem(control);
    if (!item) return '';
    const what = RejectionStatuses.includes(item.status)
      ? 'تم رفض هذا العنصر'
      : 'تمت إعادة هذا العنصر';
    return item.comment
      ? `${what} ويحتاج إلى تعديل: ${item.comment}`
      : `${what} ويحتاج إلى تعديل`;
  }

  hasFieldsToEdit(): boolean {
    return Object.keys(REVIEWED_FIELDS).some((control) => this.needsEdit(control));
  }

  private reviewedItem(control: string): any {
    const key = REVIEWED_FIELDS[control];
    return key ? (this.projectDetails as any)?.[key] : null;
  }

  onSubmit() {
    if (this.projectForm.valid && !this.submitting()) {
      this.submitting.set(true);

      // Helper function to ensure dates are in yyyy-MM-dd format
      const ensureDateFormat = (dateString: string): string =>
        toIsoDate(dateString);

      const formValues = this.projectForm.value;
      const formData: IUpdateProjectBody = {
        id: formValues.id!,
        name: formValues.name!,
        priority: formValues.priority!,
        duration: formValues.duration!,
        beneficiaries: formValues.beneficiaries!,
        supervisingAuthority: formValues.supervisingAuthority!,
        weight: formValues.weight!,
        code: formValues.code!,
        planInitiativeId: Number(formValues.planInitiativeId!),
        // A project's goal is its initiative's goal (the server enforces this).
        planGoalsId:
          this.initiatives.find(
            (i) => i.id === Number(formValues.planInitiativeId)
          )?.goalId ?? formValues.planGoalsId!,
        startDate: ensureDateFormat(formValues.startDate!),
        endDate: ensureDateFormat(formValues.endDate!),
      };

      this.planProjectsService
        .updatePlanProject(this.planId, formData)
        .subscribe({
          next: () => {
            this.submitting.set(false);
            this.projectUpdated.emit(); // Let parent handle the refresh
            this.closeModal.emit();
          },
          error: (error) => {
            console.error('Error updating project:', error);
            this.submitting.set(false);
            // TODO: Add proper error handling/user notification
          },
        });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.projectForm.controls).forEach((key) => {
      const control = this.projectForm.get(key);
      control?.markAsTouched();
    });
  }
}
