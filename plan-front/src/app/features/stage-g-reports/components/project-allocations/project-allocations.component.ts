import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeneralApiService } from '../../../../Core/Service/general-api.service';
import { FeedbackService } from '../../../feedback/services/feedback.service';
import { IPlanOption } from '../../../feedback/interfaces/IFeedback';
import {
  ALLOCATION_KINDS,
  AllocationKind,
  IAllocation,
  IProjectAllocations,
} from '../../interfaces/IProjectAllocation';
import { ProjectAllocationService } from '../../services/project-allocation.service';

interface PickerUnit {
  id: number;
  name: string;
}

// A line being added to one project's cell.
interface Draft {
  projectId: number;
  kind: AllocationKind;
  name: string;
  amount: number | null;
  notes: string;
}

// «إدارة الموارد والميزانيات والعقود» — checklist item 22.
//
// Every project as a row, with three cells: the resources, the budget lines
// and the contracts allocated to it. Filter by unit, by plan or by name.
// Lines are added straight into the cell and removed with one click.
@Component({
  selector: 'app-project-allocations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-allocations.component.html',
  styleUrl: './project-allocations.component.css',
})
export class ProjectAllocationsComponent implements OnInit {
  private service = inject(ProjectAllocationService);
  private generalApi = inject(GeneralApiService);
  private feedbackService = inject(FeedbackService);

  readonly kinds = ALLOCATION_KINDS;
  readonly Kind = AllocationKind;

  units: PickerUnit[] = [];
  plans: IPlanOption[] = [];

  // Filters
  unitId = 0; // 0 = all units
  planId = 0; // 0 = all plans
  search = '';

  rows = signal<IProjectAllocations[]>([]);
  loading = signal(false);

  // The cell currently taking a new line, or null.
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
      .projects({
        unitId: Number(this.unitId) || undefined,
        planId: Number(this.planId) || undefined,
        search: this.search.trim() || undefined,
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

  // ---- Totals across the visible rows ---------------------------------------

  get budgetTotal(): number {
    return this.rows().reduce((s, r) => s + (r.budgetTotal || 0), 0);
  }

  get contractTotal(): number {
    return this.rows().reduce((s, r) => s + (r.contractTotal || 0), 0);
  }

  // ---- Adding and removing lines ---------------------------------------------

  linesOf(row: IProjectAllocations, kind: AllocationKind): IAllocation[] {
    if (kind === AllocationKind.Resource) return row.resources;
    if (kind === AllocationKind.Budget) return row.budgets;
    return row.contracts;
  }

  kindLabel(kind: AllocationKind): string {
    return this.kinds.find((k) => k.value === kind)?.single ?? '';
  }

  // Budgets and contracts carry an amount; a resource is just a name.
  hasAmount(kind: AllocationKind): boolean {
    return kind !== AllocationKind.Resource;
  }

  isDrafting(row: IProjectAllocations, kind: AllocationKind): boolean {
    return !!this.draft && this.draft.projectId === row.projectId && this.draft.kind === kind;
  }

  startAdd(row: IProjectAllocations, kind: AllocationKind): void {
    this.draft = { projectId: row.projectId, kind, name: '', amount: null, notes: '' };
  }

  cancelAdd(): void {
    this.draft = null;
  }

  get draftValid(): boolean {
    return !!this.draft && this.draft.name.trim().length > 0 && (this.draft.amount ?? 0) >= 0;
  }

  saveDraft(): void {
    if (!this.draft || !this.draftValid || this.saving) return;
    const d = this.draft;
    this.saving = true;

    this.service
      .add({
        projectId: d.projectId,
        kind: d.kind,
        name: d.name.trim(),
        amount: this.hasAmount(d.kind) ? d.amount : null,
        notes: d.notes.trim() || null,
      })
      .subscribe({
        next: (saved) => {
          this.saving = false;
          this.rows.update((list) =>
            list.map((r) => {
              if (r.projectId !== d.projectId) return r;
              const next = { ...r };
              if (d.kind === AllocationKind.Resource) next.resources = [...r.resources, saved];
              if (d.kind === AllocationKind.Budget) {
                next.budgets = [...r.budgets, saved];
                next.budgetTotal = next.budgets.reduce((s, b) => s + (b.amount ?? 0), 0);
              }
              if (d.kind === AllocationKind.Contract) {
                next.contracts = [...r.contracts, saved];
                next.contractTotal = next.contracts.reduce((s, c) => s + (c.amount ?? 0), 0);
              }
              return next;
            })
          );
          this.draft = null;
        },
        error: () => (this.saving = false),
      });
  }

  remove(row: IProjectAllocations, line: IAllocation): void {
    if (!confirm(`هل تريد حذف «${line.name}»؟`)) return;
    this.service.remove(line.id).subscribe({
      next: () => {
        this.rows.update((list) =>
          list.map((r) => {
            if (r.projectId !== row.projectId) return r;
            const next = { ...r };
            next.resources = r.resources.filter((x) => x.id !== line.id);
            next.budgets = r.budgets.filter((x) => x.id !== line.id);
            next.contracts = r.contracts.filter((x) => x.id !== line.id);
            next.budgetTotal = next.budgets.reduce((s, b) => s + (b.amount ?? 0), 0);
            next.contractTotal = next.contracts.reduce((s, c) => s + (c.amount ?? 0), 0);
            return next;
          })
        );
      },
    });
  }
}
