import { Route } from '@angular/router';

export const INITIATIVES_PLAN: Route[] = [
  {
    path: ':planId/initiatives',
    loadComponent: () =>
      import('./pages/initiatives-stage-home/initiatives-stage-home.component').then(
        (m) => m.InitiativesStageHomeComponent
      ),
  },
];
