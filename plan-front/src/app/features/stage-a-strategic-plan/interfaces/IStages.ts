export enum Stages {
  Analysis = 'analysisStage',
  Direction = 'directionStage',
  Goals = 'goalsStage',
  Initiatives = 'initiativesStage',
  Projects = 'projectsStage',
  Reports = 'reportStage',
}

export enum StagesRouting {
  Analysis = 'analysis-stage',
  Direction = 'direction-stage',
  Goals = 'objectives',
  Initiatives = 'initiatives',
  Projects = 'projects',
  Reports = 'reports',
}

// Maps API stage names to our internal Stages enum
export enum StageApiNames {
  AnalysisStage = 'AnalysisStage',
  DirectionStage = 'DirectionStage',
  GoalsStage = 'GoalsStage',
  InitiativesStage = 'InitiativesStage',
  ProjectsStage = 'ProjectsStage',
  ReportStage = 'ReportStage',
}
