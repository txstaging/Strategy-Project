import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProgressShareModalComponent } from '../../components/progress-share-modal/progress-share-modal.component';
import { IProgressShare, progressScopeLabel } from '../../interfaces/IProgressShare';
import { ProgressShareService } from '../../services/progress-share.service';

// «مشاركات نسبة الإنجاز» — what was shared with me, and what I shared.
@Component({
  selector: 'app-progress-home',
  standalone: true,
  imports: [CommonModule, ProgressShareModalComponent],
  templateUrl: './progress-home.component.html',
  styleUrl: './progress-home.component.css',
})
export class ProgressHomeComponent implements OnInit {
  private service = inject(ProgressShareService);
  private router = inject(Router);

  readonly scopeLabel = progressScopeLabel;

  activeTab: 'inbox' | 'sent' = 'inbox';
  inbox = signal<IProgressShare[]>([]);
  sent = signal<IProgressShare[]>([]);
  loading = signal(false);
  showModal = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.inbox().subscribe({
      next: (list) => {
        this.inbox.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.service.sent().subscribe({ next: (list) => this.sent.set(list) });
  }

  get visibleList(): IProgressShare[] {
    return this.activeTab === 'inbox' ? this.inbox() : this.sent();
  }

  onShared(): void {
    this.showModal = false;
    this.activeTab = 'sent';
    this.load();
  }

  open(share: IProgressShare): void {
    this.router.navigate(['/plans/progress', share.id]);
  }
}
