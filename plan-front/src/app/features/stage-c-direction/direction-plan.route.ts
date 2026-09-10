import { Route } from '@angular/router';

export const DIRECTION_PLAN: Route[] = [
  {
    path: ':planId/direction-stage',
    loadComponent: () =>
      import(
        './pages/strategic-direction-home/strategic-direction-home.component'
      ).then((m) => m.StrategicDirectionHomeComponent),
    children: [
      // direction-stage
      {
        path: '',
        loadComponent: () =>
          import(
            './components/strategic-direction-table/strategic-direction-table.component'
          ).then((m) => m.StrategicDirectionTableComponent),
      },
    ],
  },
];
