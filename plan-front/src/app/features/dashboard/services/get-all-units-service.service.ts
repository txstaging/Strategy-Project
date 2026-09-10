import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../interfaces/iget-all-users';
import { IGetAllUnits, IGetUnitById, IUpdateUnit } from '../interfaces/iget-all-units';

@Injectable({
  providedIn: 'root'
})
export class GetAllUnitServiceService {

   constructor(private http: HttpClient) { }
    GetAllUsersUrl=`/Units`;
  toggleUserStatusUrl=`/Account/AccountSuspension`;
  GetUserByIdUrl=`/Units`
  getAllUsers(perPage: number = 5, page: number = 1): Observable<ApiResponse<IGetAllUnits[]>> {
      const params = new HttpParams()
        .set('perPage', perPage)
        .set('page', page);
  
      return this.http.get<ApiResponse<IGetAllUnits[]>>(`${this.GetAllUsersUrl}/GetAllUnits`, { params });
    }

  
   getUser(userId: number): Observable<IGetUnitById> {
      return this.http.get<IGetUnitById>(`${this.GetUserByIdUrl}/${userId}`);
    }
   UpdateUser(obj: IUpdateUnit): Observable<any> {
       return this.http.post<any>('/Units/UpdateUnit', obj);
     }

   delete(id: number): Observable<any> {
  return this.http.delete(`/Units/${id}`);
}


}
