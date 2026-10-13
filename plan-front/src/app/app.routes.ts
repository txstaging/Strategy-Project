import { Routes } from '@angular/router';
import { authGuard } from './Core/guards/auth.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { PlansLayoutComponent } from './layouts/plans-layout/plans-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    component: AuthLayoutComponent,
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      // Home
      {
        path: 'home',
        loadComponent: () =>
          import('./features/static-pages/home-page/home-page.component').then(
            (m) => m.HomePageComponent
          ),
      },
      // Privacy
      {
        path: 'privacy',
        loadComponent: () =>
          import('./features/static-pages/privacy/privacy.component').then(
            (m) => m.PrivacyComponent
          ),
      },
      // terms
      {
        path: 'terms',
        loadComponent: () =>
          import('./features/static-pages/terms/terms.component').then(
            (m) => m.TermsComponent
          ),
      },
      // blogs
      {
        path: 'blogs',
        loadChildren: () =>
          import('./features/blogs/blogs.route').then((m) => m.BLOGS),
      },
      // our-goals
      {
        path: 'our-goals',
        loadChildren: () =>
          import('./features/our-goals/our-goals.route').then((m) => m.OUR_GOALS),
      },
      // our-vision
      {
        path: 'our-vision',
        loadChildren: () =>
          import('./features/our-vision/our-vision.route').then((m) => m.OUR_VISION),
      },
      // our-message
      {
        path: 'our-message',
        loadChildren: () =>
          import('./features/our-message/our-message.route').then((m) => m.OUR_MESSAGE),
      },
      // awareness
      {
        path: 'awareness',
        loadChildren: () =>
          import('./features/awareness/awareness.route').then((m) => m.AWARENESS),
      },
      // about-us
      {
        path: 'about-us',
        loadComponent: () =>
          import('./features/static-pages/about-us/about-us.component').then(
            (m) => m.AboutUsComponent
          ),
      },
      // contact-us
      {
        path: 'contact-us',
        loadComponent: () =>
          import(
            './features/static-pages/contact-us/contact-us.component'
          ).then((m) => m.ContactUsComponent),
      },
      // faq
      {
        path: 'faq',
        loadComponent: () =>
          import('./features/static-pages/faq/faq.component').then(
            (m) => m.FaqComponent
          ),
      },
      // Admin Dashboard
      {
        path: 'settings',
        loadComponent: () =>
          import('./layouts/dashboard-layout/dashboard-layout.component').then(
            (m) => m.DashboardLayoutComponent
          ),
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/dashboard/dashboard.route').then(
            (m) => m.DASHBOARD_ROUTES
          ),
      },
      // plans
      {
        path: 'plans',
        component: PlansLayoutComponent,
        canActivate: [authGuard],
        children: [
          // strategic-plan
          {
            path: '',
            loadChildren: () =>
              import(
                './features/stage-a-strategic-plan/strategic-plan.route'
              ).then((m) => m.STRATEGIC_PLAN),
          },
          // analysis
          {
            path: '',
            loadChildren: () =>
              import('./features/stage-b-analysis/analysis-plan.route').then(
                (m) => m.ANALYSiS_PLAN
              ),
          },
          // direction
          {
            path: '',
            loadChildren: () =>
              import('./features/stage-c-direction/direction-plan.route').then(
                (m) => m.DIRECTION_PLAN
              ),
          },
          // objectives
          {
            path: '',
            loadChildren: () =>
              import(
                './features/stage-d-objectives/objectives-plan.route'
              ).then((m) => m.OBJECTIVE_PLAN),
          },
          // initiatives
          {
            path: '',
            loadChildren: () =>
              import(
                './features/stage-e-initiatives/initiatives-plan.route'
              ).then((m) => m.INITIATIVES_PLAN),
          },
          // projects
          {
            path: '',
            loadChildren: () =>
              import('./features/stage-f-projects/projects-plan.route').then(
                (m) => m.PROJECTS_PLAN
              ),
          },
          // reports
          {
            path: '',
            loadChildren: () =>
              import('./features/stage-g-reports/reports-plan.route').then(
                (m) => m.REPORTS
              ),
          },
          // feedback (طلب المرئيات)
          {
            path: '',
            loadChildren: () =>
              import('./features/feedback/feedback.route').then(
                (m) => m.FEEDBACK
              ),
          },
          // progress shares (مشاركة نسبة الإنجاز)
          {
            path: '',
            loadChildren: () =>
              import('./features/progress-share/progress-share.route').then(
                (m) => m.PROGRESS_SHARE
              ),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '/home', pathMatch: 'full' },
];
