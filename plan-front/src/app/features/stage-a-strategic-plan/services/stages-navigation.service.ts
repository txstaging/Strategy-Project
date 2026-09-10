import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Stages, StagesRouting, StageApiNames } from '../interfaces/IStages';

@Injectable({
  providedIn: 'root',
})
export class StagesNavigationService {
  private router = inject(Router);

  // Stage order for progression
  private stageOrder: Stages[] = [
    Stages.Analysis,
    Stages.Direction,
    Stages.Goals,
    Stages.Initiatives,
    Stages.Projects,
  ];

  // Stage button text mapping (Arabic)
  private stageButtonText: Record<Stages, string> = {
    [Stages.Analysis]: 'الي التحليل',
    [Stages.Direction]: 'الي التوجه الاستراتيجي',
    [Stages.Goals]: 'الي الأهداف',
    [Stages.Initiatives]: 'الي المبادرات',
    [Stages.Projects]: 'الي المشاريع',
  };

  // Map from API stage names to our internal Stages enum
  private apiStageMap: Record<string, Stages> = {
    [StageApiNames.AnalysisStage]: Stages.Analysis,
    [StageApiNames.DirectionStage]: Stages.Direction,
    [StageApiNames.GoalsStage]: Stages.Goals,
    [StageApiNames.InitiativesStage]: Stages.Initiatives,
    [StageApiNames.ProjectsStage]: Stages.Projects,
  };

  // Get the appropriate route for a stage
  getStageRoute(stage: Stages): string {
    const routeMap: Record<Stages, StagesRouting> = {
      [Stages.Analysis]: StagesRouting.Analysis,
      [Stages.Direction]: StagesRouting.Direction,
      [Stages.Goals]: StagesRouting.Goals,
      [Stages.Initiatives]: StagesRouting.Initiatives,
      [Stages.Projects]: StagesRouting.Projects,
    };

    return routeMap[stage];
  }

  // Get the button text for a stage
  getStageButtonText(stage: Stages): string {
    return this.stageButtonText[stage];
  }

  // Get the current active stage for a plan based on planStatus
  getCurrentStage(planStatus: any): Stages {
    // If planStatus is undefined or null, default to Analysis
    if (!planStatus) {
      return Stages.Analysis;
    }

    // Check if the API has sent the currentStage property directly
    if (planStatus.currentStage) {
      // Use our mapping to convert API stage name to internal enum
      const mappedStage =
        this.apiStageMap[planStatus.currentStage] || Stages.Analysis;
      return mappedStage;
    }

    // Fallback to the previous approach for backward compatibility
    if (planStatus.analysisStage) {
      return Stages.Analysis;
    } else if (planStatus.directionStage) {
      return Stages.Direction;
    } else if (planStatus.goalsStage) {
      return Stages.Goals;
    } else if (planStatus.initiativesStage) {
      return Stages.Initiatives;
    } else if (planStatus.projectsStage) {
      return Stages.Projects;
    }

    // Default to analysis if no stage is active
    return Stages.Analysis;
  }

  // Navigate to a specific stage
  navigateToStage(planId: string, stage: Stages): void {
    const route = this.getStageRoute(stage);
    this.router.navigate(['/plans', planId, route]);
  }

  // Check if a stage is available for a plan
  isStageAvailable(planStatus: any, stage: Stages): boolean {
    // If we have the currentStage property directly from the API
    if (planStatus && planStatus.currentStage) {
      // Get the current stage as our enum type
      const currentStage = this.getCurrentStage(planStatus);

      // Get index of current and requested stages in the progression order
      const currentIndex = this.stageOrder.indexOf(currentStage);
      const requestedIndex = this.stageOrder.indexOf(stage);

      // A stage is available if it's the current stage or comes before it in the progression
      return requestedIndex <= currentIndex;
    }

    // Fallback to the previous approach for backward compatibility
    const availabilityMap: Record<Stages, (status: any) => boolean> = {
      [Stages.Analysis]: (status) => status.analysisStage,
      [Stages.Direction]: (status) => status.directionStage,
      [Stages.Goals]: (status) => status.goalsStage,
      [Stages.Initiatives]: (status) => status.initiativesStage,
      [Stages.Projects]: (status) => status.projectsStage,
    };

    return availabilityMap[stage](planStatus);
  }

  // Navigate to the current in-progress stage
  navigateToInProgressStage(planId: string, planStatus: any): void {
    const currentStage = this.getCurrentStage(planStatus);
    this.navigateToStage(planId, currentStage);
  }
}
