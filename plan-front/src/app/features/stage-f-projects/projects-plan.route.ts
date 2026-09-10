import { Route } from '@angular/router';

export const PROJECTS_PLAN: Route[] = [
  {
    path: ':planId/projects',
    loadComponent: () =>
      import('./pages/projects-stage-home/projects-stage-home.component').then(
        (m) => m.ProjectsStageHomeComponent
      ),
  },
];
