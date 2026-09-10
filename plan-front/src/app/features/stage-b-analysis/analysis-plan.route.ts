import { Route } from '@angular/router';

export const ANALYSiS_PLAN: Route[] = [
  {
    path: ':planId/analysis-stage',
    loadComponent: () =>
      import('./pages/analysis-stage-home/analysis-stage-home.component').then(
        (m) => m.AnalysisStageHomeComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './pages/analysis-all-tables/analysis-all-tables.component'
          ).then((m) => m.AnalysisAllTablesComponent),
      },
      {
        path: 'Threats',
        loadComponent: () =>
          import(
            './pages/analysis-threats-page/analysis-threats-page.component'
          ).then((m) => m.AnalysisThreatsPageComponent),
      },
      {
        path: 'Strength',
        loadComponent: () =>
          import(
            './pages/analysis-strength-page/analysis-strength-page.component'
          ).then((m) => m.AnalysisStrengthPageComponent),
      },
      {
        path: 'Risks',
        loadComponent: () =>
          import(
            './pages/analysis-risks-page/analysis-risks-page.component'
          ).then((m) => m.AnalysisRisksPageComponent),
      },
      {
        path: 'Opportunities',
        loadComponent: () =>
          import(
            './pages/analysis-opportunities-page/analysis-opportunities-page.component'
          ).then((m) => m.AnalysisOpportunitiesPageComponent),
      },
      {
        path: 'Priorities',
        loadComponent: () =>
          import(
            './pages/analysis-priority-page/analysis-priority-page.component'
          ).then((m) => m.AnalysisPriorityPageComponent),
      },
      {
        path: 'FinalAnalysis',
        loadComponent: () =>
          import(
            './pages/analysis-final-page/analysis-final-page.component'
          ).then((m) => m.AnalysisFinalPageComponent),
      },
    ],
  },
];
