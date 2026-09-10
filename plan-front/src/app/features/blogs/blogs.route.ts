import { Routes } from '@angular/router';
import { authGuard } from '../../Core/guards/auth.guard';

export const BLOGS: Routes = [
  // blogs
  {
    path: '',
    loadComponent: () =>
      import('./pages/blog-home/blogs.component').then((m) => m.BlogsComponent),
  },
  // blogs/manage
  {
    path: 'manage',
    loadComponent: () =>
      import('./components/blog-table/blog-table.component').then(
        (m) => m.BlogTableComponent
      ),
    canActivate: [authGuard],
  },
  // blogs/new
  {
    path: 'new',
    loadComponent: () =>
      import('./components/blog-form/blog-form.component').then(
        (m) => m.BlogFormComponent
      ),
    canActivate: [authGuard],
  },
  // blogs/edit/:id
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./components/blog-form/blog-form.component').then(
        (m) => m.BlogFormComponent
      ),
    canActivate: [authGuard],
  },
  // blogs/:id
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/blog-detail/blog-detail.component').then(
        (m) => m.BlogDetailComponent
      ),
  },
];
