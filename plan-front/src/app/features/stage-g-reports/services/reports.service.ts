import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IGetReportsResponse } from '../interfaces/IGetReportsResponse';
import { Observable } from 'rxjs';

export interface PercentageHistoryRow {
  id: number;
  value: string;
  status: string;
  comment: string | null;
  filePath: string | null;
  employeeName: string | null;
  createdAt: string;
  updatedAt: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  constructor(private http: HttpClient) {}

  getReportsData(): Observable<IGetReportsResponse> {
    return this.http.get<IGetReportsResponse>(`/Reports/unit`);
  }

  // Employee submits a new percentage with an optional file attachment.
  // Backend replaces the pending row if one exists (single live cycle).
  submitPercentage(
    projectId: number,
    percentage: number,
    file: File | null
  ): Observable<any> {
    const form = new FormData();
    form.append('percentage', percentage.toString());
    if (file) {
      form.append('file', file, file.name);
    }
    return this.http.post(`/Reports/Submit/${projectId}`, form);
  }

  // Backwards-compatible: no file, just the value.
  updateProjectFinishedPercentage(
    projectId: number,
    percentage: number
  ): Observable<any> {
    return this.submitPercentage(projectId, percentage, null);
  }

  approvePercentage(projectId: number): Observable<any> {
    return this.http.post(`/Reports/ApprovePercentage/${projectId}`, {});
  }

  rejectPercentage(projectId: number, Comments: string): Observable<any> {
    return this.http.post(`/Reports/RejectPercentage/${projectId}`, { Comments });
  }

  returnPercentage(projectId: number, Comments: string): Observable<any> {
    return this.http.post(`/Reports/ReturnPercentage/${projectId}`, { Comments });
  }

  getPercentageHistory(projectId: number): Observable<PercentageHistoryRow[]> {
    return this.http.get<PercentageHistoryRow[]>(`/Reports/History/${projectId}`);
  }
}
