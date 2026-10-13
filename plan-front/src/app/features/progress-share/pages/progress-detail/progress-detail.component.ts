import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IProgressShare, progressScopeLabel } from '../../interfaces/IProgressShare';
import { ProgressShareService } from '../../services/progress-share.service';

// One shared progress figure. This is where a progress notification lands.
// Shows the figure as it was when shared, the figure now, who sent it and to
// whom, and links through to the live reports table.
@Component({
  selector: 'app-progress-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-detail.component.html',
  styleUrl: './progress-detail.component.css',
})
export class ProgressDetailComponent implements OnInit {
  private service = inject(ProgressShareService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly scopeLabel = progressScopeLabel;

  share = signal<IProgressShare | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) this.load(id);
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.service.getOne(id).subscribe({
      next: (s) => {
        this.share.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // Positive when progress has moved on since it was shared.
  delta(s: IProgressShare): number | null {
    if (s.livePercentage === null || s.livePercentage === undefined) return null;
    return Math.round((s.livePercentage - s.percentage) * 100) / 100;
  }

  openReports(): void {
    this.router.navigate(['/plans/reports']);
  }

  back(): void {
    this.router.navigate(['/plans/progress']);
  }
}
