import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { feedbackSubjectLabel, IFeedbackRequest } from '../../interfaces/IFeedback';
import { FeedbackService } from '../../services/feedback.service';

// One «طلب مرئيات»: the question, who it went to, the answers so far, and a
// reply box. This is where a feedback notification lands when it is clicked.
@Component({
  selector: 'app-feedback-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback-detail.component.html',
  styleUrl: './feedback-detail.component.css',
})
export class FeedbackDetailComponent implements OnInit {
  private feedbackService = inject(FeedbackService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly subjectLabel = feedbackSubjectLabel;

  request = signal<IFeedbackRequest | null>(null);
  loading = signal(true);
  reply = '';
  sending = false;

  ngOnInit(): void {
    // Re-read on every id change, so moving between two feedback notifications
    // without leaving the route still loads the right request.
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) this.load(id);
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.feedbackService.getOne(id).subscribe({
      next: (r) => {
        this.request.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // The reply box is for addressees only; the requester sees the answers instead.
  get canReply(): boolean {
    const r = this.request();
    return !!r && !r.isClosed && !r.isMine;
  }

  submitReply(): void {
    const r = this.request();
    if (!r || this.sending || this.reply.trim().length === 0) return;

    this.sending = true;
    this.feedbackService.respond(r.id, this.reply.trim()).subscribe({
      next: () => {
        this.sending = false;
        this.reply = '';
        this.load(r.id);
      },
      error: () => (this.sending = false),
    });
  }

  close(): void {
    const r = this.request();
    if (!r) return;
    this.feedbackService.close(r.id).subscribe({ next: () => this.load(r.id) });
  }

  // Link through to the screen the request is about, so the recipient can look
  // at the work before answering.
  openSubject(): void {
    const r = this.request();
    if (!r) return;

    const routes: Record<string, string> = {
      'plans': '/plans',
      'analysis-stage': `/plans/${r.planId}/analysis-stage`,
      'direction-stage': `/plans/${r.planId}/direction-stage`,
      'objectives': `/plans/${r.planId}/objectives/current-objectives`,
      'initiatives': `/plans/${r.planId}/initiatives`,
      'projects': `/plans/${r.planId}/projects`,
      'reports': '/plans/reports',
    };

    // The communication sheet is one screen for all plans, so the plan goes
    // in the query rather than the path.
    if (r.subject === 'communication') {
      this.router.navigate(['/plans/communication'], { queryParams: { planId: r.planId } });
      return;
    }

    const target = routes[r.subject];
    if (target) this.router.navigateByUrl(target);
  }

  back(): void {
    this.router.navigate(['/plans/feedback']);
  }

  answeredCount(r: IFeedbackRequest): number {
    return r.recipients.filter((x) => x.hasResponded).length;
  }
}
