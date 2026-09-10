import { Routes } from '@angular/router';
import { authGuard } from '../../Core/guards/auth.guard';

export const OUR_VISION: Routes = [
  // our-vision
  {
    path: '',
    loadComponent: () =>
      import('./pages/vision-home/vision-home.component').then((m) => m.VisionHomeComponent),
  },
  // our-vision/manage
  {
    path: 'manage',
    loadComponent: () =>
      import('./components/vision-table/vision-table.component').then(
        (m) => m.VisionTableComponent
      ),
    canActivate: [authGuard],
  },
  // our-vision/new
  {
    path: 'new',
    loadComponent: () =>
      import('./components/vision-form/vision-form.component').then(
        (m) => m.VisionFormComponent
      ),
    canActivate: [authGuard],
  },
  // our-vision/edit/:id
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./components/vision-form/vision-form.component').then(
        (m) => m.VisionFormComponent
      ),
    canActivate: [authGuard],
  },
  // our-vision/:id
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/vision-detail/vision-detail.component').then(
        (m) => m.VisionDetailComponent
      ),
  },
];
