import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { convertArabicNumbersToEnglish } from '../../../Core/utilities/utils';

export const keysToConvertToEnglish = ['impact', 'degreeOfCertainty'];

@Injectable({
  providedIn: 'root',
})
export class AnalysisStageService {
  constructor(private readonly _http: HttpClient) {}

  // Analysis
  getAllAnalysisStageForManager(params?: Record<string, any>) {
    return this._http.get<any>(`/Plans/0/Analysis/GetAll`, { params });
  }

  getAnalysisStageDetails(planId: string) {
    return this._http.get<any>(`/Plans/${planId}/Analysis`);
  }

  approvePlanAnalysis(planId: string) {
    return this._http.post<any>(`/Plans/${planId}/Analysis/Approve`, null);
  }

  // Points
  approveAnalysisPoint(planId: string | number, pointId: string | number) {
    return this._http.post<any>(
      `/Plans/${planId}/Analysis/Points/${pointId}/Approve`,
      null
    );
  }

  rejectAnalysisPoint(
    planId: string | number,
    pointId: string | number,
    comment: string
  ) {
    return this._http.post<any>(
      `/Plans/${planId}/Analysis/Points/${pointId}/Reject`,
      { comment }
    );
  }

  returnAnalysisPoint(
    planId: string | number,
    pointId: string | number,
    comment: string
  ) {
    return this._http.post<any>(
      `/Plans/${planId}/Analysis/Points/${pointId}/Return`,
      { comment }
    );
  }

  createAnalysisPoint(data: any) {
    keysToConvertToEnglish.forEach((key) => {
      if (data[key]) {
        data[key] = convertArabicNumbersToEnglish(data[key]);
      }
    });

    return this._http.post<any>(`/Plans/${data.planId}/Analysis/Points`, data);
  }

  updateAnalysisPoint(data: any) {
    for (const key of keysToConvertToEnglish) {
      if (data[key]) {
        data[key] = convertArabicNumbersToEnglish(data[key]);
      }
    }
    return this._http.post<any>(
      `/Plans/${data.planId}/Analysis/Points/${data.id}`,
      data
    );
  }

  deleteAnalysisPoint(data: any) {
    return this._http.delete<any>(
      `/Plans/${data.planId}/Analysis/Points/${data.id}`
    );
  }

  getAnalysisStageLists(planId: string, params: Record<string, any>) {
    return this._http.get<any>(`/Plans/${planId}/Analysis/Points`, {
      params,
    });
  }
}
