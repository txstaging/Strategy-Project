import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  IGetAllProjectsResponse,
  IGetAllProjectsApiResponse,
} from '../interfaces/IGetAllProjectsResponse';
import { IGetProjectByIdResponse } from '../interfaces/IGetProjectById';
import { IAddProjectBody } from '../interfaces/IAddProjectBody';
import { IUpdateProjectBody } from '../interfaces/IUpdateProjectBody';
import { IGetAcceptableInitiativesResponse } from '../interfaces/IGetAcceptableInitiativesResponse';

// Interface definitions for cleaner code

interface ProjectStatusResponse {
  status: string;
  data?: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PlanProjectsService {
  private readonly http = inject(HttpClient);

  /**
   * Get acceptable initiatives for a plan
   */
  getAcceptableInitiative(
    planId: string
  ): Observable<IGetAcceptableInitiativesResponse[]> {
    return this.http
      .get<
        ApiResponse<IGetAcceptableInitiativesResponse[]>
      >(`/Project/GetAcceptableInitiatives/${planId}`)
      .pipe(
        map((response) => response.data || (response as any)),
        catchError(
          this.handleError<IGetAcceptableInitiativesResponse[]>(
            'getAcceptableInitiative',
            []
          )
        )
      );
  }

  /**
   * Get project status for a plan
   */
  getProjectStatus(planId: string): Observable<ProjectStatusResponse> {
    return this.http
      .get<ProjectStatusResponse>(`/Project/ProjectStageStatus/${planId}`)
      .pipe(
        catchError(this.handleError<ProjectStatusResponse>('getProjectStatus'))
      );
  }

  /**
   * Approve project stage
   */
  approveProjectStage(planId: string): Observable<void> {
    return this.http
      .post<void>(`/Project/ApproveProjectStage/${planId}`, null)
      .pipe(catchError(this.handleError<void>('approveProjectStage')));
  }

  /**
   * Get all projects for a plan
   */
  getAllProjects(planId: string): Observable<IGetAllProjectsResponse[]> {
    return this.http
      .get<IGetAllProjectsApiResponse>(`/Project?PlanId=${planId}`)
      .pipe(
        map((response) => response.data || (response as any)),
        catchError(
          this.handleError<IGetAllProjectsResponse[]>('getAllProjects', [])
        )
      );
  }

  /**
   * Get project by ID
   */
  getProjectById(projectId: string): Observable<IGetProjectByIdResponse> {
    return this.http
      .get<IGetProjectByIdResponse>(`/Project/${projectId}`)
      .pipe(
        catchError(this.handleError<IGetProjectByIdResponse>('getProjectById'))
      );
  }

  /**
   * Create a new project
   */
  createPlanProject(planId: string, data: IAddProjectBody): Observable<void> {
    return this.http
      .post<void>(`/Project/${planId}`, [data])
      .pipe(catchError(this.handleError<void>('createPlanProject')));
  }

  /**
   * Delete a project
   */
  deletePlanProject(projectId: string): Observable<void> {
    return this.http
      .delete<void>(`/Project/${projectId}`)
      .pipe(catchError(this.handleError<void>('deletePlanProject')));
  }

  /**
   * Update project (general update)
   */
  updateProject(data: IUpdateProjectBody): Observable<void> {
    return this.http
      .post<void>(`/Project`, data)
      .pipe(catchError(this.handleError<void>('updateProject')));
  }

  /**
   * Approve a project
   */
  approveProject(projectId: string): Observable<void> {
    return this.http
      .post<void>(`/Project/ApproveProject/${projectId}`, null)
      .pipe(catchError(this.handleError<void>('approveProject')));
  }

  /**
   * Get plan project (alternative endpoint)
   */
  getPlanProject(
    planId: string,
    projectId: string
  ): Observable<IGetProjectByIdResponse> {
    return this.http
      .get<IGetProjectByIdResponse>(
        `/Plans/${planId}/PlanProjects/${projectId}`
      )
      .pipe(
        catchError(this.handleError<IGetProjectByIdResponse>('getPlanProject'))
      );
  }

  /**
   * Update plan project (alternative endpoint)
   */
  updatePlanProject(
    planId: string,
    data: IUpdateProjectBody
  ): Observable<void> {
    return this.http
      .post<void>(`/Project`, data)
      .pipe(catchError(this.handleError<void>('updatePlanProject')));
  }

  /**
   * Approve project item
   */
  approveProjectItem(projectId: string): Observable<void> {
    return this.http
      .post<void>(`/Project/ApproveItem/${projectId}`, null)
      .pipe(catchError(this.handleError<void>('approveProjectItem')));
  }

  /**
   * Return project item with comments
   */
  returnProjectItem(
    projectId: string,
    itemId: string,
    Comments: string
  ): Observable<void> {
    return this.http
      .post<void>(`/Project/ReturnItem/${projectId}/${itemId}`, {
        Comments,
      })
      .pipe(catchError(this.handleError<void>('returnProjectItem')));
  }

  /**
   * Reject project item with comments
   */
  rejectProjectItem(
    projectId: string,
    itemId: string,
    Comments: string
  ): Observable<void> {
    return this.http
      .post<void>(`/Project/RejectItem/${projectId}/${itemId}`, {
        Comments,
      })
      .pipe(catchError(this.handleError<void>('rejectProjectItem')));
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);

      // Log error details for debugging
      console.error('Full error details:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error.error,
      });

      // Let the app keep running by returning an empty result or result parameter
      return of(result as T);
    };
  }
}
