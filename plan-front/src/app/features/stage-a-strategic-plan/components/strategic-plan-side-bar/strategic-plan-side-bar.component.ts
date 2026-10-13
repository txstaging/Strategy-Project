import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { PlanStatusService } from '../../services/PlanStatus.service';
import { IGetPlanStatus } from '../../../stage-b-analysis/interfaces/IGetPlanStatus';
import { StagesNavigationService } from '../../services/stages-navigation.service';
import { Stages } from '../../interfaces/IStages';

@Component({
  selector: 'app-strategic-plan-side-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './strategic-plan-side-bar.component.html',
  styleUrl: './strategic-plan-side-bar.component.css',
})
export class StrategicPlanSideBarComponent implements OnInit, OnDestroy {
  private planStatusService = inject(PlanStatusService);
  private stagesNavigationService = inject(StagesNavigationService);

  planId: string | null = null;
  planStatus: IGetPlanStatus = {
    analysisStage: false,
    directionStage: false,
    goalsStage: false,
    initiativesStage: false,
    projectsStage: false,
    reportStage: false,
  };

  private subscription: Subscription | null = null;

  constructor(public router: Router) {}

  ngOnInit(): void {
    // Extract plan ID from URL (assumes URL pattern like /strategy-plan/:planId/...)
    this.subscription = this.router.events.subscribe((event) => {
      const planIdBefore = this.planId;
      this.extractPlanIdFromUrl();

      // A stage unlocks when the stage before it is finally approved, which
      // happens on the page itself and does not change the plan id. Re-read the
      // status after each navigation within the same plan, or a newly unlocked
      // stage stayed greyed out here until a full page reload — e.g. after the
      // final approval of the goals, «المبادرات» stayed locked.
      if (event instanceof NavigationEnd && this.planId && this.planId === planIdBefore) {
        this.fetchPlanStatus();
      }
    });

    // Initial extraction
    this.extractPlanIdFromUrl();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private extractPlanIdFromUrl(): void {
    const urlSegments = this.router.url.split('/');
    // Find planId in the URL (assuming it follows /strategy-plan/ or appears as a number in the URL)
    for (let i = 0; i < urlSegments.length; i++) {
      if (
        // urlSegments[i] === 'strategy-plan' &&
        i + 1 < urlSegments.length &&
        !isNaN(Number(urlSegments[i + 1]))
      ) {
        const newPlanId = urlSegments[i + 1];

        // Only update and fetch if plan ID changed
        if (this.planId !== newPlanId) {
          this.planId = newPlanId;
          this.fetchPlanStatus();
        }
        return;
      }
    }

    // Reset if no plan ID found
    if (this.planId !== null) {
      this.planId = null;
      this.resetPlanStatus();
    }
  }

  private fetchPlanStatus(): void {
    if (!this.planId) return;

    this.planStatusService.getPlanStatus(this.planId).subscribe({
      next: (response) => {
        this.planStatus = response;
      },
      error: (error) => {
        console.error('Error fetching plan status:', error);
        this.resetPlanStatus();
      },
    });
  }

  private resetPlanStatus(): void {
    this.planStatus = {
      analysisStage: false,
      directionStage: false,
      goalsStage: false,
      initiativesStage: false,
      projectsStage: false,
      reportStage: false,
    };
  }

  navigateToStage(stage: string): void {
    if (!this.planId) return;

    // Map the route string to the Stages enum
    let targetStage: Stages;
    switch (stage) {
      case 'analysis-stage':
        targetStage = Stages.Analysis;
        break;
      case 'direction-stage':
        targetStage = Stages.Direction;
        break;
      case 'objectives':
        targetStage = Stages.Goals;
        break;
      case 'initiatives':
        targetStage = Stages.Initiatives;
        break;
      case 'projects':
        targetStage = Stages.Projects;
        break;
      case 'reports':
        targetStage = Stages.Reports;
        break;
      default:
        targetStage = Stages.Analysis;
        break;
    }

    // Check if the stage is available and navigate
    if (
      this.planStatus &&
      this.stagesNavigationService.isStageAvailable(
        this.planStatus,
        targetStage
      )
    ) {
      this.stagesNavigationService.navigateToStage(this.planId, targetStage);
    }
  }

  // Handle keyboard navigation for accessibility
  onKeyDown(event: KeyboardEvent, stage: string): void {
    // Navigate on Enter or Space key
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (this.isStageActive(stage)) {
        this.navigateToStage(stage);
      }
    }
  }

  isStageActive(stage: string): boolean {
    switch (stage) {
      case 'analysis-stage':
        return this.planStatus.analysisStage;
      case 'direction-stage':
        return this.planStatus.directionStage;
      case 'objectives':
        return this.planStatus.goalsStage;
      case 'initiatives':
        return this.planStatus.initiativesStage;
      case 'projects':
        return this.planStatus.projectsStage;
      default:
        return false;
    }
  }
}
