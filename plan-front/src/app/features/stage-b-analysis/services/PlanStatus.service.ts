import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IGetPlanStatus } from '../interfaces/IGetPlanStatus';

@Injectable({
  providedIn: 'root',
})
export class PlanStatusService {
  // Use signals for reactive state management
  public isAnalysisApproved = signal<boolean>(false);
  public planId = signal<string>('');
  public currentStage = signal<string>('');
  public planStatus = signal<IGetPlanStatus | null>(null);

  private _HttpClient = inject(HttpClient);

  // Set the plan ID and fetch its status
  setPlanId(id: string): void {
    this.planId.set(id);
    this.refreshPlanStatus();
  }

  // Set the current table type
  setCurrentStage(stage: string): void {
    this.currentStage.set(stage);
  }

  // Fetch and update plan status
  refreshPlanStatus(): void {
    if (!this.planId()) return;

    this.getPlanStatus(this.planId()).subscribe({
      next: (status) => this.planStatus.set(status),
      error: (err) => console.error('Error fetching plan status:', err)
    });
  }

  getPlanStatus(planId: string): Observable<IGetPlanStatus> {
    return this._HttpClient.get<IGetPlanStatus>(`/PlanStatus/${planId}`).pipe(
      tap(status => this.planStatus.set(status))
    );
  }
}
