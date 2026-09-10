import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IAddInitiativesBody } from '../interfaces/IAddInitiativesBody';
import {
  IAllAcceptedObjectvies,
  IPlanInitiativeStatus,
} from '../interfaces/IAllAcceptedObjectvies';
import { IGetInitiativesById } from '../interfaces/IGetInitiativesById';
import { IUpdateInitiativesBody } from '../interfaces/IUpdateInitiativesBody';

@Injectable({
  providedIn: 'root',
})
export class InitiativesService {
  private readonly http = inject(HttpClient);

  // getAcceptableGoals
  getAcceptableGoals(planId: string): Observable<{ data: IAllAcceptedObjectvies[] }> {
    return this.http.get<{ data: IAllAcceptedObjectvies[] }>(
      `/Initiatives/GetAcceptableGoals/${planId}`
    );
  }

  // getAcceptableInitiatives
  getAcceptableInitiatives(planId: string) {
    return this.http.get<IAllAcceptedObjectvies[]>(
      `/Initiatives/GetAcceptableGoals/${planId}`
    );
  }

  // getInitiativeStatus
  getInitiativeStatus(planId: string) {
    return this.http.get<IPlanInitiativeStatus>(
      `/Initiatives/InitiativeStageStatus/${planId}`
    );
  }

  // approveInitiativeStage (whole stage approval)
  approveInitiativeStage(planId: string): Observable<any> {
    return this.http.post(`/Initiatives/ApproveInitiativeStage/${planId}`, null);
  }

  // getInitiatives
  getInitiatives(planId: string): Observable<any> {
    return this.http.get(`/Initiatives?PlanId=${planId}`);
  }

  // getInitiativeById
  getInitiativeById(id: number) {
    return this.http.get<IGetInitiativesById>(`/Initiatives/${id}`);
  }

  // updateInitiative
  updateInitiative(data: IUpdateInitiativesBody): Observable<any> {
    return this.http.post(`/Initiatives`, data);
  }

  // createInitiative
  createInitiative(planId: string, data: IAddInitiativesBody): Observable<any> {
    // API expects an array of initiatives
    return this.http.post(`/Initiatives/${planId}`, [data]);
  }

  // approveInitiative (individual initiative approval)
  approveInitiative(initiativeId: string): Observable<any> {
    return this.http.post(
      `/Initiatives/ApproveInitiative/${initiativeId}`,
      null
    );
  }

  // rejectInitiative (individual initiative rejection)
  rejectInitiative(
    planId: string,
    initiativeId: string,
    Comments: string
  ): Observable<any> {
    return this.http.post(`/Initiatives/RejectInitiative/${initiativeId}`, {
      Comments,
    });
  }

  // returnInitiative (individual initiative return)
  returnInitiative(
    planId: string,
    initiativeId: string,
    Comments: string
  ): Observable<any> {
    return this.http.post(`/Initiatives/ReturnInitiative/${initiativeId}`, {
      Comments,
    });
  }

  // deleteInitiative
  deleteInitiative(initiativeId: string): Observable<any> {
    return this.http.delete(`/Initiatives/${initiativeId}`);
  }

  // Initiative item-level approval methods
  approveInitiativeItem(
    planId?: string,
    initiativeItemId?: string
  ): Observable<any> {
    return this.http.post(`/Initiatives/ApproveItem/${initiativeItemId}`, null);
  }

  rejectInitiativeItem(
    planId: string,
    initiativeId: string,
    itemId: string,
    Comments: string
  ): Observable<any> {
    return this.http.post(`/Initiatives/RejectItem/${initiativeId}/${itemId}`, {
      Comments,
    });
  }

  returnInitiativeItem(
    planId: string,
    initiativeId: string,
    itemId: string,
    Comments: string
  ): Observable<any> {
    return this.http.post(`/Initiatives/ReturnItem/${initiativeId}/${itemId}`, {
      Comments,
    });
  }

  // Initiative item-level approval methods
  approveInitiativeKPI(
    planId: string,
    initiativeItemId: string
  ): Observable<any> {
    return this.http.post(`/Initiatives/ApproveKpis/${initiativeItemId}`, null);
  }

  rejectInitiativeKPI(
    planId: string,
    initiativeId: string,
    itemId: string,
    Comments: string
  ): Observable<any> {
    return this.http.post(`/Initiatives/RejectKpis/${initiativeId}/${itemId}`, {
      Comments,
    });
  }

  returnInitiativeKPI(
    planId: string,
    initiativeId: string,
    itemId: string,
    Comments: string
  ): Observable<any> {
    return this.http.post(`/Initiatives/ReturnKpis/${initiativeId}/${itemId}`, {
      Comments,
    });
  }
}
