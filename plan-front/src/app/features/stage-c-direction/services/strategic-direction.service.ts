import { DirectionItemsElement } from './../../stage-a-strategic-plan/interfaces/iadd-strategic-direction-element';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApprovePlanDirectionResponse } from '../interfaces/IApprovePlanDirectionResponse';
@Injectable({
  providedIn: 'root',
})
export class StrategicDirectionService {
  constructor(private _http: HttpClient) {}

  /**
   * Get all strategic directions for a plan
   * @param planId Plan ID
   */
  getPlanDirection(planId: string): Observable<any> {
    return this._http.get<DirectionItemsElement>(
      `/Plans/${planId}/PlanDirection`
    );
  }

  /**
   * Approve strategic directions for a plan
   * @param planId Plan ID
   * @param planDirectionId Plan Direction ID
   */
  approvePlanDirection(
    planId: string,
    planDirectionId: string
  ): Observable<any> {
    return this._http.post<IApprovePlanDirectionResponse>(
      `/Plans/${planId}/PlanDirection/Approve/${planDirectionId}`,
      {}
    );
  }

  /**
   * Create or update a strategic direction item (Vision, Message, Value)
   * @param planId Plan ID
   * @param directionItem Direction item data with type (Vision, Message, Value)
   */
  createDirectionItem(
    planId: string,
    directionItem: {
      id: number;
      name: string;
      type: string;
      comment: string;
      directionItemsElements: {
        id?: number;
        name: string;
        comment: string;
        status: string;
      }[];
    }
  ): Observable<any> {
    return this._http.post<any>(
      `/Plans/${planId}/Direction/Items`,
      directionItem
    );
  }

  /**
   * Create or update a strategic direction item (Vision, Message, Value)
   * @param planId Plan ID
   * @param directionItem Direction item data with type (Vision, Message, Value)
   */
  updateDirectionItem(
    planId: string,
    directionItem: {
      id: number;
      name: string;
      type: string;
      comment: string;
      directionItemsElements: {
        id?: number;
        name: string;
        comment: string;
        status: string;
      }[];
    }
  ): Observable<any> {
    return this._http.post<any>(
      `/Plans/${planId}/Direction/Items/Update`,
      directionItem
    );
  }

  /**
   * Get specific direction item (Vision, Message, Value) by ID
   * @param planId Plan ID
   * @param itemId Direction item ID
   */
  getDirectionItemById(planId: string, itemId: string): Observable<any> {
    return this._http.get<any>(`/Plans/${planId}/Direction/Items/${itemId}`);
  }

  /**
   * delete specific direction item (Vision, Message, Value) by ID
   * @param planId Plan ID
   * @param itemId Direction item ID
   */
  deleteDirectionItem(planId: string, itemId: string): Observable<any> {
    return this._http.delete<any>(`/Plans/${planId}/Direction/Items/${itemId}`);
  }

  /**
   * Approve a direction item
   * @param planId Plan ID
   * @param type Direction type
   */
  approveDirectionItem(
    planId: string,
    directionItemId: string
  ): Observable<any> {
    return this._http.post<any>(
      `/Plans/${planId}/Direction/Items/Approve/${directionItemId}`,
      {}
    );
  }

  /**
   * Reject a direction item
   * @param planId Plan ID
   * @param type Direction type
   * @param comment Rejection comment
   */
  rejectDirectionItem(
    planId: string,
    directionItemId: string,
    comments?: string
  ): Observable<any> {
    return this._http.post<any>(
      `/Plans/${planId}/Direction/Items/Reject/${directionItemId}`,
      { comments }
    );
  }

  /**
   * Return a direction item
   * @param planId Plan ID
   * @param type Direction type
   * @param comment Return comment
   */
  returnDirectionItem(
    planId: string,
    directionItemId: string,
    comments?: string
  ): Observable<any> {
    return this._http.post<any>(
      `/Plans/${planId}/Direction/Items/Return/${directionItemId}`,
      { comments }
    );
  }

  /**
   * Reject a direction element
   * @param planId Plan ID
   * @param elementId Element ID
   * @param comment Rejection comment
   */
  rejectDirectionElement(
    planId: string,
    elementId: string,
    comments?: string
  ): Observable<any> {
    return this._http.post<any>(
      `/Plans/${planId}/Direction/element/reject/${elementId}`,
      { comments }
    );
  }

  /**
   * Return a direction element
   * @param planId Plan ID
   * @param elementId Element ID
   * @param comment Return comment
   */
  returnDirectionElement(
    planId: string,
    elementId: string,
    Comments?: string
  ): Observable<any> {
    return this._http.post<any>(
      `/Plans/${planId}/Direction/element/return/${elementId}`,
      { Comments }
    );
  }

  /**
   * Approve a direction element
   * @param planId Plan ID
   * @param elementId Element ID
   */
  approveDirectionElement(planId: string, elementId: string): Observable<any> {
    return this._http.post<any>(
      `/Plans/${planId}/Direction/element/approve/${elementId}`,
      null
    );
  }
}
