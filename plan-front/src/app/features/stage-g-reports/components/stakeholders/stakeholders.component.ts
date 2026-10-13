import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GeneralApiService } from '../../../../Core/Service/general-api.service';
import { FeedbackService } from '../../../feedback/services/feedback.service';
import { IPlanOption } from '../../../feedback/interfaces/IFeedback';
import {
  IInitiativeStakeholders,
  IProjectStakeholders,
} from '../../interfaces/IStakeholders';
import { StakeholdersService } from '../../services/stakeholders.service';

interface PickerUnit {
  id: number;
  name: string;
}

// «المعنيون بالمبادرات والمشاريع» — checklist item 23.
//
// Read-only. Two tables: the officer in charge and the partners of every
// initiative, and the supervising authority and the beneficiaries of every
// project. These come from the initiative and project cards, so changing
// them happens there; this screen only gathers them in one place.
@Component({
  selector: 'app-stakeholders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stakeholders.component.html',
  styleUrl: './stakeholders.component.css',
})
export class StakeholdersComponent implements OnInit {
  private service = inject(StakeholdersService);
  private generalApi = inject(GeneralApiService);
  private feedbackService = inject(FeedbackService);
  private router = inject(Router);

  units: PickerUnit[] = [];
  plans: IPlanOption[] = [];

  // Filters
  unitId = 0;
  planId = 0;
  search = '';
  activeTab: 'initiatives' | 'projects' = 'initiatives';

  initiatives = signal<IInitiativeStakeholders[]>([]);
  projects = signal<IProjectStakeholders[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.generalApi.getUnits().subscribe({
      next: (res: any) => (this.units = res?.data ?? res ?? []),
    });
    this.feedbackService.plans().subscribe({ next: (p) => (this.plans = p) });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service
      .list({
        unitId: Number(this.unitId) || undefined,
        planId: Number(this.planId) || undefined,
        search: this.search.trim() || undefined,
      })
      .subscribe({
        next: (r) => {
          this.initiatives.set(r.initiatives);
          this.projects.set(r.projects);
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

  // Counts of distinct names across what is shown, for the header line.
  get partnerCount(): number {
    return new Set(this.initiatives().flatMap((i) => i.partners)).size;
  }

  get beneficiaryCount(): number {
    return this.projects().filter((p) => (p.beneficiaries ?? '').trim().length > 0).length;
  }

  // Jump to the card where the names are edited.
  openInitiatives(row: IInitiativeStakeholders): void {
    this.router.navigate(['/plans', row.planId, 'initiatives']);
  }

  openProjects(row: IProjectStakeholders): void {
    this.router.navigate(['/plans', row.planId, 'projects']);
  }
}
