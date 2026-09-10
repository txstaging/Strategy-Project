import { Routes } from '@angular/router';
import { authGuard } from '../../Core/guards/auth.guard';

export const OUR_GOALS: Routes = [
  // our-goals
  {
    path: '',
    loadComponent: () =>
      import('./pages/goals-home/goals-home.component').then((m) => m.GoalsHomeComponent),
  },
  // our-goals/manage
  {
    path: 'manage',
    loadComponent: () =>
      import('./components/goal-table/goal-table.component').then(
        (m) => m.GoalTableComponent
      ),
    canActivate: [authGuard],
  },
  // our-goals/new
  {
    path: 'new',
    loadComponent: () =>
      import('./components/goal-form/goal-form.component').then(
        (m) => m.GoalFormComponent
      ),
    canActivate: [authGuard],
  },
  // our-goals/edit/:id
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./components/goal-form/goal-form.component').then(
        (m) => m.GoalFormComponent
      ),
    canActivate: [authGuard],
  },
  // our-goals/:id
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/goal-detail/goal-detail.component').then(
        (m) => m.GoalDetailComponent
      ),
  },
];
