import { Route } from '@angular/router';

// Under /plans, sharing the plans layout and auth guard. The detail route is
// what a progress notification deep-links to.
export const PROGRESS_SHARE: Route[] = [
  {
    path: 'progress',
    loadComponent: () =>
      import('./pages/progress-home/progress-home.component').then(
        (m) => m.ProgressHomeComponent
      ),
  },
  {
    path: 'progress/:id',
    loadComponent: () =>
      import('./pages/progress-detail/progress-detail.component').then(
        (m) => m.ProgressDetailComponent
      ),
  },
];
