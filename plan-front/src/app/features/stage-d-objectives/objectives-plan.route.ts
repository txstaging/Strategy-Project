import { Route } from '@angular/router';

export const OBJECTIVE_PLAN: Route[] = [
  {
    path: ':planId/objectives',
    loadComponent: () =>
      import('./components/objectives-stage-table/objectives-stage-table.component').then(
        (m) => m.ObjectivesStageTableComponent
      ),
    children: [
      // current-objectives
      {
        path: 'current-objectives',
        loadComponent: () =>
          import(
            './components/objectives-stage-table/objectives-stage-table.component'
          ).then((m) => m.ObjectivesStageTableComponent),
      },
      // objectives-history
      {
        path: 'objectives-history',
        loadComponent: () =>
          import(
            './pages/objectives-stage-history/objectives-stage-history.component'
          ).then((m) => m.ObjectivesStageHistoryComponent),
      },
      { path: '', redirectTo: 'current-objectives', pathMatch: 'full' },
    ],
  },
];
