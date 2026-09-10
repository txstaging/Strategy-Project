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
];
