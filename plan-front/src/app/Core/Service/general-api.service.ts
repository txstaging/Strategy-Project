import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeneralApiService {
  constructor(private http: HttpClient) {}

  getUnits(): Observable<any> {
    return this.http.get('/Units/All');
  }
}
