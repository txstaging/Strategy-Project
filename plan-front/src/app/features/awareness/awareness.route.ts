import { Routes } from '@angular/router';
import { authGuard } from '../../Core/guards/auth.guard';

export const AWARENESS: Routes = [
  // awareness
  {
    path: '',
    loadComponent: () =>
      import('./pages/awareness-home/awareness-home.component').then((m) => m.AwarenessHomeComponent),
  },
  // awareness/manage
  {
    path: 'manage',
    loadComponent: () =>
      import('./components/awareness-table/awareness-table.component').then(
        (m) => m.AwarenessTableComponent
      ),
    canActivate: [authGuard],
  },
  // awareness/new
  {
    path: 'new',
    loadComponent: () =>
      import('./components/awareness-form/awareness-form.component').then(
        (m) => m.AwarenessFormComponent
      ),
    canActivate: [authGuard],
  },
  // awareness/edit/:id
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./components/awareness-form/awareness-form.component').then(
        (m) => m.AwarenessFormComponent
      ),
    canActivate: [authGuard],
  },
  // awareness/:id
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/awareness-detail/awareness-detail.component').then(
        (m) => m.AwarenessDetailComponent
      ),
  },
];
