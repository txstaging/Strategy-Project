import { UserDataViewComponent } from './pages/user-data-view/user-data-view.component';
import { UserControllerComponent } from './pages/user-controller/user-controller.component';
import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  { path: '', redirectTo: 'settings', pathMatch: 'full' },
  {
    path: '',
    loadComponent: () =>
      import(
        './pages/navigation-card-list-page/navigation-card-list-page.component'
      ).then((m) => m.NavigationCardListPageComponent),
  },
  {
    path: 'controllers',
    loadComponent: () =>
      import('./pages/controllers/controllers.component').then(
        (m) => m.ControllersComponent
      ),
  },
  {
    path: 'user-controller',
    loadComponent: () =>
      import('./pages/user-controller/user-controller.component').then(
        (m) => m.UserControllerComponent
      ),
  },
  {
   path: 'user-view-data/:id',
    loadComponent: () =>
      import('./pages/user-data-view/user-data-view.component').then(
        (m) => m.UserDataViewComponent
      ),
  },
  {
   path: 'user-update-data/:id',
    loadComponent: () =>
      import('./pages/update-user/update-user.component').then(
        (m) => m.UpdateUserComponent
      ),
  },
  

  {
    path: 'create-unit',
    loadComponent: () =>
      import('./pages/create-unit/create-unit.component').then(
        (m) => m.CreateUnitComponent
      ),
  },
    {
    path: 'create-user',
    loadComponent: () =>
      import('./pages/create-user/create-user.component').then(
        (m) => m.CreateUserComponent
      ),
  },
  {
    path: 'unit-controller',
    loadComponent: () =>
      import('./pages/unit-controller/unit-controller.component').then(
        (m) => m.UnitControllerComponent
      ),
  },
  {
   path: 'unit-update-data/:id',
    loadComponent: () =>
      import('./pages/update-unit/update-unit.component').then(
        (m) => m.UpdateUnitComponent
      ),
  },
  {
    path: 'title-management',
    loadComponent: () =>
      import('../../features/page-titles/pages/title-management/title-management.component').then(
        (m) => m.TitleManagementComponent
      ),
  },
];
