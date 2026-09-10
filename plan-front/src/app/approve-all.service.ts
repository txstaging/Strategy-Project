import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApproveAllService {

  constructor(private http: HttpClient) { }


  approvePoints(planId: number): Observable<any> 

  {
    return this.http.post(`/Plans/${planId}/Analysis/Points/Approve`,{});

  }
  ApproveDirection(planId: number): Observable<any> 

  {
    return this.http.post(`/Plans/${planId}/Direction/Items/Convert`,{});

  }
  ApproveGoal(planId: number): Observable<any> 

  {
    return this.http.post(`/Goals/Convert/${planId}`,{});

  }
  ApproveInitiatives(planId: number): Observable<any> 

  {
    return this.http.post(`/Initiatives/Convert/${planId}`,{});

  }
  ApproveProject(planId: number): Observable<any> 

  {
    return this.http.post(`/Project/Convert/${planId}`,{});

  }



}

  
  



