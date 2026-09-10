import { Routes } from '@angular/router';
import { authGuard } from '../../Core/guards/auth.guard';

export const OUR_MESSAGE: Routes = [
  // our-message
  {
    path: '',
    loadComponent: () =>
      import('./pages/message-home/message-home.component').then((m) => m.MessageHomeComponent),
  },
  // our-message/manage
  {
    path: 'manage',
    loadComponent: () =>
      import('./components/message-table/message-table.component').then(
        (m) => m.MessageTableComponent
      ),
    canActivate: [authGuard],
  },
  // our-message/new
  {
    path: 'new',
    loadComponent: () =>
      import('./components/message-form/message-form.component').then(
        (m) => m.MessageFormComponent
      ),
    canActivate: [authGuard],
  },
  // our-message/edit/:id
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./components/message-form/message-form.component').then(
        (m) => m.MessageFormComponent
      ),
    canActivate: [authGuard],
  },
  // our-message/:id
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/message-detail/message-detail.component').then(
        (m) => m.MessageDetailComponent
      ),
  },
];
