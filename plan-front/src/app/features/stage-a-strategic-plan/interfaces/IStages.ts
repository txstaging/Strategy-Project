export enum Stages {
  Analysis = 'analysisStage',
  Direction = 'directionStage',
  Goals = 'goalsStage',
  Initiatives = 'initiativesStage',
  Projects = 'projectsStage',
}

export enum StagesRouting {
  Analysis = 'analysis-stage',
  Direction = 'direction-stage',
  Goals = 'objectives',
  Initiatives = 'initiatives',
  Projects = 'projects',
}

// Maps API stage names to our internal Stages enum
export enum StageApiNames {
  AnalysisStage = 'AnalysisStage',
  DirectionStage = 'DirectionStage',
  GoalsStage = 'GoalsStage',
  InitiativesStage = 'InitiativesStage',
  ProjectsStage = 'ProjectsStage',
}
