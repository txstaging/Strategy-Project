import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { GeneralApiService } from '../../../../Core/Service/general-api.service';
import { RolesEnums } from '../../../../Core/utilities/consts';
import {
  FEEDBACK_SUBJECTS,
  feedbackSubjectLabel,
  IFeedbackRequest,
  IPlanOption,
  ISubjectOption,
} from '../../interfaces/IFeedback';
import { FeedbackService } from '../../services/feedback.service';
import { HttpClient } from '@angular/common/http';

interface PickerUnit {
  id: number;
  name: string;
}
interface PickerUser {
  id: number;
  displayName: string;
  unitName?: string;
  role?: string;
}

// «طلب المرئيات والتغذية الراجعة» — checklist item 14.
//
// Two lists: what was asked of me, and what I asked of others. Managers can
// compose a new request here. The composer walks the sender through it in
// order: which plan, which part of it, which item if any, the question, then
// who should answer.
@Component({
  selector: 'app-feedback-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './feedback-home.component.html',
  styleUrl: './feedback-home.component.css',
})
export class FeedbackHomeComponent implements OnInit {
  private feedbackService = inject(FeedbackService);
  private generalApi = inject(GeneralApiService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly subjects = FEEDBACK_SUBJECTS;
  readonly subjectLabel = feedbackSubjectLabel;

  activeTab: 'inbox' | 'sent' = 'inbox';
  inbox = signal<IFeedbackRequest[]>([]);
  sent = signal<IFeedbackRequest[]>([]);
  loading = signal(false);

  // ---- Composer ------------------------------------------------------------
  showComposer = false;
  saving = false;

  plans: IPlanOption[] = [];
  subjectItems: ISubjectOption[] = [];
  loadingSubjects = false;
  units: PickerUnit[] = [];
  users: PickerUser[] = [];

  unitSearch = '';
  userSearch = '';

  form = {
    planId: 0,
    subject: 5, // المشاريع is the most common thing to ask about
    subjectId: 0, // 0 = the whole stage
    message: '',
    dueDate: '' as string,
    unitIds: [] as number[],
    userIds: [] as number[],
  };

  ngOnInit(): void {
    const planId = Number(this.route.snapshot.paramMap.get('planId'));
    if (planId) this.form.planId = planId;
    this.load();
  }

  get canRequest(): boolean {
    const role = this.authService.getUserRole();
    return (
      role === RolesEnums.UnitManager ||
      role === RolesEnums.RegionManager ||
      role === RolesEnums.HighManagement
    );
  }

  load(): void {
    this.loading.set(true);
    this.feedbackService.inbox().subscribe({
      next: (list) => {
        this.inbox.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.feedbackService.sent().subscribe({ next: (list) => this.sent.set(list) });
  }

  get visibleList(): IFeedbackRequest[] {
    return this.activeTab === 'inbox' ? this.inbox() : this.sent();
  }

  // ---- Composer: opening and pickers ---------------------------------------

  openComposer(): void {
    this.showComposer = true;
    this.form.message = '';
    this.form.dueDate = '';
    this.form.subjectId = 0;
    this.form.unitIds = [];
    this.form.userIds = [];
    this.unitSearch = '';
    this.userSearch = '';

    if (this.plans.length === 0) {
      this.feedbackService.plans().subscribe({
        next: (p) => {
          this.plans = p;
          // Preselect the only plan, or the one from the URL, then load its items.
          if (!this.form.planId && p.length === 1) this.form.planId = p[0].id;
          this.reloadSubjectItems();
        },
      });
    } else {
      this.reloadSubjectItems();
    }

    if (this.units.length === 0) {
      this.generalApi.getUnits().subscribe({
        next: (res: any) => (this.units = res?.data ?? res ?? []),
      });
    }
    if (this.users.length === 0) {
      // One page large enough for everyone, since there is no search endpoint.
      this.http
        .get<any>('/Account/GetAllUsers?perPage=1000&page=1')
        .subscribe({ next: (res) => (this.users = res?.data ?? []) });
    }
  }

  closeComposer(): void {
    this.showComposer = false;
  }

  // Plans and reports have no items inside them to pick from.
  get subjectHasItems(): boolean {
    const s = Number(this.form.subject);
    return s !== 0 && s !== 6 && s !== 9;
  }

  // Called whenever the plan or the stage changes: the item list depends on both.
  reloadSubjectItems(): void {
    this.form.subjectId = 0;
    this.subjectItems = [];
    if (!this.form.planId || !this.subjectHasItems) return;

    this.loadingSubjects = true;
    this.feedbackService.subjects(this.form.planId, Number(this.form.subject)).subscribe({
      next: (items) => {
        this.subjectItems = items;
        this.loadingSubjects = false;
      },
      error: () => (this.loadingSubjects = false),
    });
  }

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
    const i = this.form.unitIds.indexOf(id);
    if (i === -1) this.form.unitIds.push(id);
    else this.form.unitIds.splice(i, 1);
  }

  toggleUser(id: number): void {
    const i = this.form.userIds.indexOf(id);
    if (i === -1) this.form.userIds.push(id);
    else this.form.userIds.splice(i, 1);
  }

  isUnitPicked = (id: number) => this.form.unitIds.includes(id);
  isUserPicked = (id: number) => this.form.userIds.includes(id);

  // The line above the send button: who is going to get this.
  get recipientSummary(): string {
    const unitNames = this.form.unitIds
      .map((id) => this.units.find((u) => u.id === id)?.name)
      .filter((n): n is string => !!n);
    const people = this.form.userIds.length;

    if (unitNames.length === 0 && people === 0) return '';

    const parts: string[] = [];
    if (unitNames.length === 1) parts.push(`وحدة ${unitNames[0]}`);
    else if (unitNames.length > 1) parts.push(`${unitNames.length} وحدات`);
    if (people === 1) parts.push('شخص واحد');
    else if (people > 1) parts.push(`${people} أشخاص`);

    return 'سيصل هذا الطلب إلى ' + parts.join(' و ');
  }

  get canSubmit(): boolean {
    return (
      !this.saving &&
      !!this.form.planId &&
      this.form.message.trim().length > 0 &&
      (this.form.unitIds.length > 0 || this.form.userIds.length > 0)
    );
  }

  submit(): void {
    if (!this.canSubmit) return;
    this.saving = true;

    this.feedbackService
      .create({
        planId: Number(this.form.planId),
        message: this.form.message.trim(),
        subject: Number(this.form.subject),
        subjectId: this.form.subjectId ? Number(this.form.subjectId) : null,
        dueDate: this.form.dueDate || null,
        unitIds: this.form.unitIds,
        userIds: this.form.userIds,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.showComposer = false;
          this.activeTab = 'sent';
          this.load();
        },
        error: () => (this.saving = false),
      });
  }

  open(request: IFeedbackRequest): void {
    this.router.navigate(['/plans/feedback', request.id]);
  }

  answeredCount(request: IFeedbackRequest): number {
    return request.recipients.filter((r) => r.hasResponded).length;
  }
}
