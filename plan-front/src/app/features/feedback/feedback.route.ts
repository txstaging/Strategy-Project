import { Route } from '@angular/router';

// Sits under /plans so it shares the plans layout and the auth guard.
// The detail route is what a feedback notification deep-links to.
export const FEEDBACK: Route[] = [
  {
    path: 'feedback',
    loadComponent: () =>
      import('./pages/feedback-home/feedback-home.component').then(
        (m) => m.FeedbackHomeComponent
      ),
  },
  {
    path: 'feedback/:id',
    loadComponent: () =>
      import('./pages/feedback-detail/feedback-detail.component').then(
        (m) => m.FeedbackDetailComponent
      ),
  },
];
