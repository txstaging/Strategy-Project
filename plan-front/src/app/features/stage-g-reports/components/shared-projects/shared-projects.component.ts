import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeneralApiService } from '../../../../Core/Service/general-api.service';
import { FeedbackService } from '../../../feedback/services/feedback.service';
import { IPlanOption } from '../../../feedback/interfaces/IFeedback';
import {
  CONTRIBUTION_STATUSES,
  CONTRIBUTION_TYPES,
  ContributionStatus,
  ContributionType,
  contributionStatusLabel,
  contributionTypeLabel,
  IParticipant,
  ISharedProject,
} from '../../interfaces/ISharedProjects';
import { SharedProjectsService } from '../../services/shared-projects.service';

interface PickerUnit {
  id: number;
  name: string;
}

// A participant being added or edited.
interface Draft {
  projectId: number;
  participantId: number | null; // null = adding
  unitId: number; // 0 = free-text party instead
  partyName: string;
  contributionType: ContributionType;
  contribution: string;
  amount: number | null;
  status: ContributionStatus;
  notes: string;
}

// «قائمة المشاريع المشتركة» — checklist item 24.
//
// Every project that more than one department takes part in, with each
// participant and the action it commits to: a budget, resources, part of the
// execution, supervision, or something else. Participants are added and
// edited in place under their project.
@Component({
  selector: 'app-shared-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shared-projects.component.html',
  styleUrl: './shared-projects.component.css',
})
export class SharedProjectsComponent implements OnInit {
  private service = inject(SharedProjectsService);
  private generalApi = inject(GeneralApiService);
  private feedbackService = inject(FeedbackService);

  readonly types = CONTRIBUTION_TYPES;
  readonly statuses = CONTRIBUTION_STATUSES;
  readonly typeLabel = contributionTypeLabel;
  readonly statusLabel = contributionStatusLabel;
  readonly Type = ContributionType;
  readonly Status = ContributionStatus;

  units: PickerUnit[] = [];
  plans: IPlanOption[] = [];

  // Filters
  unitId = 0;
  planId = 0;
  search = '';
  onlyShared = true;

  rows = signal<ISharedProject[]>([]);
  loading = signal(false);

  draft: Draft | null = null;
  saving = false;

  ngOnInit(): void {
    this.generalApi.getUnits().subscribe({
      next: (res: any) => (this.units = res?.data ?? res ?? []),
    });
    this.feedbackService.plans().subscribe({ next: (p) => (this.plans = p) });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.draft = null;
    this.service
      .list({
        unitId: Number(this.unitId) || undefined,
        planId: Number(this.planId) || undefined,
        search: this.search.trim() || undefined,
        onlyShared: this.onlyShared,
      })
      .subscribe({
        next: (r) => {
          this.rows.set(r);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  clearFilters(): void {
    this.unitId = 0;
    this.planId = 0;
    this.search = '';
    this.load();
  }

  get hasFilter(): boolean {
    return !!Number(this.unitId) || !!Number(this.planId) || this.search.trim().length > 0;
  }

  // ---- Summary across what is shown ------------------------------------------

  get participantCount(): number {
    return this.rows().reduce((s, r) => s + r.participants.length, 0);
  }

  get budgetTotal(): number {
    return this.rows().reduce(
      (s, r) => s + r.participants.reduce((t, p) => t + (p.amount ?? 0), 0),
      0
    );
  }

  // ---- Adding and editing ----------------------------------------------------

  isDraftingFor(row: ISharedProject): boolean {
    return !!this.draft && this.draft.projectId === row.projectId && this.draft.participantId === null;
  }

  isEditing(p: IParticipant): boolean {
    return !!this.draft && this.draft.participantId === p.id;
  }

  startAdd(row: ISharedProject): void {
    this.draft = {
      projectId: row.projectId,
      participantId: null,
      unitId: 0,
      partyName: '',
      contributionType: ContributionType.Execution,
      contribution: '',
      amount: null,
      status: ContributionStatus.Planned,
      notes: '',
    };
  }

  startEdit(row: ISharedProject, p: IParticipant): void {
    this.draft = {
      projectId: row.projectId,
      participantId: p.id,
      unitId: p.unitId ?? 0,
      partyName: p.partyName ?? '',
      contributionType: p.contributionType,
      contribution: p.contribution,
      amount: p.amount ?? null,
      status: p.status,
      notes: p.notes ?? '',
    };
  }

  cancel(): void {
    this.draft = null;
  }

  get draftIsBudget(): boolean {
    return !!this.draft && Number(this.draft.contributionType) === ContributionType.Budget;
  }

  get draftValid(): boolean {
    if (!this.draft) return false;
    const hasWho = Number(this.draft.unitId) > 0 || this.draft.partyName.trim().length > 0;
    return hasWho && this.draft.contribution.trim().length > 0 && (this.draft.amount ?? 0) >= 0;
  }

  save(): void {
    if (!this.draft || !this.draftValid || this.saving) return;
    const d = this.draft;
    this.saving = true;

    const body = {
      projectId: d.projectId,
      unitId: Number(d.unitId) > 0 ? Number(d.unitId) : null,
      partyName: Number(d.unitId) > 0 ? null : d.partyName.trim(),
      contributionType: Number(d.contributionType),
      contribution: d.contribution.trim(),
      amount: this.draftIsBudget ? d.amount : null,
      status: Number(d.status),
      notes: d.notes.trim() || null,
    };

    const call = d.participantId ? this.service.update(d.participantId, body) : this.service.add(body);

    call.subscribe({
      next: (saved) => {
        this.saving = false;
        this.rows.update((list) =>
          list.map((r) => {
            if (r.projectId !== d.projectId) return r;
            const participants = d.participantId
              ? r.participants.map((p) => (p.id === saved.id ? saved : p))
              : [...r.participants, saved];
            return { ...r, participants };
          })
        );
        this.draft = null;
      },
      error: () => (this.saving = false),
    });
  }

  remove(row: ISharedProject, p: IParticipant): void {
    if (!confirm(`هل تريد إزالة «${p.displayName}» من هذا المشروع؟`)) return;
    this.service.remove(p.id).subscribe({
      next: () =>
        this.rows.update((list) =>
          list.map((r) =>
            r.projectId === row.projectId
              ? { ...r, participants: r.participants.filter((x) => x.id !== p.id) }
              : r
          )
        ),
    });
  }
}
