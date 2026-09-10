import { Route } from '@angular/router';

export const STRATEGIC_PLAN: Route[] = [
  {
    path: '',

    loadComponent: () =>
      import('./pages/strategic-plan-home/strategic-plan-home.component').then(
        (m) => m.StrategicPlanHomeComponent
      ),
  },
  {
    path: 'history',
    loadComponent: () =>
      import(
        './pages/strategic-plan-history/strategic-plan-history.component'
      ).then((m) => m.StrategicPlanHistoryComponent),
  },
];
