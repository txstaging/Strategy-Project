import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { GeneralApiService } from '../../../../Core/Service/general-api.service';
import { FeedbackService } from '../../../feedback/services/feedback.service';
import { IPlanOption } from '../../../feedback/interfaces/IFeedback';
import {
  COMMUNICATION_METHODS,
  CommunicationMethod,
  communicationMethodLabel,
  ICommunicationEntry,
} from '../../interfaces/ICommunicationPlan';
import { CommunicationPlanService } from '../../services/communication-plan.service';

// A row being edited or added. Kept apart from the saved row so cancelling
// an edit does not need a reload.
interface RowDraft {
  date: string;
  channel: string;
  method: CommunicationMethod;
  responsibleOfficer: string;
  actionTaken: string;
}

interface PickerUnit {
  id: number;
  name: string;
}
interface PickerUser {
  id: number;
  displayName: string;
  unitName?: string;
}

// «خطة التواصل والمجازفات» — checklist item 21.
//
// A sheet under the reports stage, one plan at a time. Rows are added and
// edited in place like a spreadsheet. The panel at the bottom sends the sheet
// to chosen units or people with a comment, and waits for their views: that
// is a feedback request with the communication subject, so it travels through
// the same notifications and the same reply screen as every other request.
@Component({
  selector: 'app-communication-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './communication-plan.component.html',
  styleUrl: './communication-plan.component.css',
})
export class CommunicationPlanComponent implements OnInit {
  private service = inject(CommunicationPlanService);
  private feedbackService = inject(FeedbackService);
  private generalApi = inject(GeneralApiService);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly methods = COMMUNICATION_METHODS;
  readonly methodLabel = communicationMethodLabel;

  // FormNameToReturnToFront.communication on the server.
  private readonly COMMUNICATION_SUBJECT = 9;

  plans: IPlanOption[] = [];
  planId = 0;

  rows = signal<ICommunicationEntry[]>([]);
  loading = signal(false);

  // Inline editing state
  editingId: number | null = null;
  draft: RowDraft = this.emptyDraft();
  adding = false;
  saving = false;

  // Send-for-feedback panel
  comment = '';
  units: PickerUnit[] = [];
  users: PickerUser[] = [];
  unitSearch = '';
  userSearch = '';
  unitIds: number[] = [];
  userIds: number[] = [];
  sending = false;

  ngOnInit(): void {
    // Arriving from a feedback notification carries the plan in the query.
    const fromQuery = Number(this.route.snapshot.queryParamMap.get('planId'));
    if (fromQuery) this.planId = fromQuery;

    this.feedbackService.plans().subscribe({
      next: (p) => {
        this.plans = p;
        if (!this.planId && p.length > 0) this.planId = p[0].id;
        this.load();
      },
    });

    this.generalApi.getUnits().subscribe({
      next: (res: any) => (this.units = res?.data ?? res ?? []),
    });
    this.http
      .get<any>('/Account/GetAllUsers?perPage=1000&page=1')
      .subscribe({ next: (res) => (this.users = res?.data ?? []) });
  }

  // ---- Sheet ----------------------------------------------------------------

  load(): void {
    if (!this.planId) return;
    this.loading.set(true);
    this.cancelEdit();
    this.service.list(Number(this.planId)).subscribe({
      next: (r) => {
        this.rows.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private emptyDraft(): RowDraft {
    return {
      date: new Date().toISOString().slice(0, 10),
      channel: '',
      method: CommunicationMethod.Phone,
      responsibleOfficer: '',
      actionTaken: '',
    };
  }

  startAdd(): void {
    this.editingId = null;
    this.adding = true;
    this.draft = this.emptyDraft();
  }

  startEdit(row: ICommunicationEntry): void {
    this.adding = false;
    this.editingId = row.id;
    this.draft = {
      date: row.date.slice(0, 10),
      channel: row.channel,
      method: row.method,
      responsibleOfficer: row.responsibleOfficer,
      actionTaken: row.actionTaken,
    };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.adding = false;
  }

  get draftValid(): boolean {
    return (
      !!this.draft.date &&
      this.draft.channel.trim().length > 0 &&
      this.draft.responsibleOfficer.trim().length > 0 &&
      this.draft.actionTaken.trim().length > 0
    );
  }

  saveDraft(): void {
    if (!this.draftValid || this.saving) return;
    this.saving = true;

    const body = {
      planId: Number(this.planId),
      date: this.draft.date,
      channel: this.draft.channel.trim(),
      method: Number(this.draft.method),
      responsibleOfficer: this.draft.responsibleOfficer.trim(),
      actionTaken: this.draft.actionTaken.trim(),
    };

    const call = this.editingId
      ? this.service.update(this.editingId, body)
      : this.service.add(body);

    call.subscribe({
      next: (saved) => {
        this.saving = false;
        if (this.editingId) {
          this.rows.update((list) => list.map((r) => (r.id === saved.id ? saved : r)));
        } else {
          this.rows.update((list) => [...list, saved]);
        }
        this.cancelEdit();
      },
      error: () => (this.saving = false),
    });
  }

  remove(row: ICommunicationEntry): void {
    if (!confirm('هل تريد حذف هذا السجل؟')) return;
    this.service.remove(row.id).subscribe({
      next: () => this.rows.update((list) => list.filter((r) => r.id !== row.id)),
    });
  }

  // ---- Send for feedback ----------------------------------------------------

  get filteredUnits(): PickerUnit[] {
    const q = this.unitSearch.trim().toLowerCase();
    return q ? this.units.filter((u) => u.name.toLowerCase().includes(q)) : this.units;
  }

  get filteredUsers(): PickerUser[] {
    const q = this.userSearch.trim().toLowerCase();
    return q
      ? this.users.filter(
          (u) =>
            u.displayName.toLowerCase().includes(q) ||
            (u.unitName ?? '').toLowerCase().includes(q)
        )
      : this.users;
  }

  toggleUnit(id: number): void {
    const i = this.unitIds.indexOf(id);
    if (i === -1) this.unitIds.push(id);
    else this.unitIds.splice(i, 1);
  }

  toggleUser(id: number): void {
    const i = this.userIds.indexOf(id);
    if (i === -1) this.userIds.push(id);
    else this.userIds.splice(i, 1);
  }

  isUnitPicked = (id: number) => this.unitIds.includes(id);
  isUserPicked = (id: number) => this.userIds.includes(id);

  get recipientSummary(): string {
    const unitNames = this.unitIds
      .map((id) => this.units.find((u) => u.id === id)?.name)
      .filter((n): n is string => !!n);
    const people = this.userIds.length;
    if (unitNames.length === 0 && people === 0) return '';

    const parts: string[] = [];
    if (unitNames.length === 1) parts.push(`وحدة ${unitNames[0]}`);
    else if (unitNames.length > 1) parts.push(`${unitNames.length} وحدات`);
    if (people === 1) parts.push('شخص واحد');
    else if (people > 1) parts.push(`${people} أشخاص`);
    return 'ستصل الخطة إلى ' + parts.join(' و ');
  }

  get canSend(): boolean {
    return (
      !this.sending &&
      !!this.planId &&
      this.rows().length > 0 &&
      this.comment.trim().length > 0 &&
      (this.unitIds.length > 0 || this.userIds.length > 0)
    );
  }

  send(): void {
    if (!this.canSend) return;
    this.sending = true;

    this.feedbackService
      .create({
        planId: Number(this.planId),
        message: this.comment.trim(),
        subject: this.COMMUNICATION_SUBJECT,
        subjectId: null,
        dueDate: null,
        unitIds: this.unitIds,
        userIds: this.userIds,
      })
      .subscribe({
        next: (res) => {
          this.sending = false;
          this.comment = '';
          this.unitIds = [];
          this.userIds = [];
          this.toastr.success('تم إرسال خطة التواصل، وستصلك المرئيات في قائمة الإشعارات', 'تم الإرسال');
          this.router.navigate(['/plans/feedback', res.id]);
        },
        error: () => (this.sending = false),
      });
  }
}
