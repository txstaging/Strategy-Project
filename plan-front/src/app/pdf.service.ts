import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor(private http: HttpClient) { }
   getPdf(id: number): Observable<Blob> {
    return this.http.get(
      `/PdfGenrator/pdff/${id}`,
      { responseType: 'blob' }
    );
  }
  getPdffora(id: number): Observable<Blob> {
    return this.http.get(
      `/PdfGenrator/pdf/${id}`,
      { responseType: 'blob' }
    );
  }
  getPdfforgoal(id: number): Observable<Blob> {
    return this.http.get(
      `/PdfGenrator/goals-pdf/${id}`,
      { responseType: 'blob' }
    );
  }
  getPdfforinit(id: number): Observable<Blob> {
    return this.http.get(
      `/intiController1/initiatives-pdf/${id}`,
      { responseType: 'blob' }
    );
  }
  getPdfforproject(id: number): Observable<Blob> {
    return this.http.get(
      `/ProjectsPdf/${id}`,
      { responseType: 'blob' }
    );
  }
  getPdfAll(id: number): Observable<Blob> {
    return this.http.get(
      `/pdf/full/${id}`,
      { responseType: 'blob' }
    );
  }
}
