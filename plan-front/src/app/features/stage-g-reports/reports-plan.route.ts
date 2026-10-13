import { Route } from '@angular/router';

export const REPORTS: Route[] = [
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/reports-home/reports-home.component').then(
        (m) => m.ReportsHomeComponent
      ),
    children: [
      // done-percentage
      {
        path: '',
        loadComponent: () =>
          import(
            './components/reports-done-table/reports-done-table.component'
          ).then((m) => m.ReportsDoneTableComponent),
      },
      // collective-template
      {
        path: 'collective-template',
        loadComponent: () =>
          import(
            './components/reports-collective-template/reports-collective-template.component'
          ).then((m) => m.ReportsCollectiveTemplateComponent),
      },
      // collective-report
      {
        path: 'collective-report',
        loadComponent: () =>
          import(
            './components/reports-collective-report/reports-collective-report.component'
          ).then((m) => m.ReportsCollectiveReportComponent),
      },
    ],
  },
  // Two screens that sit beside التقارير in the side menu rather than inside
  // it. They live in this feature folder because they belong to the reports
  // stage, but each has its own page.
  {
    path: 'communication',
    loadComponent: () =>
      import(
        './components/communication-plan/communication-plan.component'
      ).then((m) => m.CommunicationPlanComponent),
  },
  {
    path: 'resources',
    loadComponent: () =>
      import(
        './components/project-allocations/project-allocations.component'
      ).then((m) => m.ProjectAllocationsComponent),
  },
  {
    path: 'stakeholders',
    loadComponent: () =>
      import('./components/stakeholders/stakeholders.component').then(
        (m) => m.StakeholdersComponent
      ),
  },
  {
    path: 'shared-projects',
    loadComponent: () =>
      import('./components/shared-projects/shared-projects.component').then(
        (m) => m.SharedProjectsComponent
      ),
  },
];
