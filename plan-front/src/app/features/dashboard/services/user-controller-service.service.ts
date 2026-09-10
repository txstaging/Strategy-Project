import { IGetUserById } from './../interfaces/iget-user-by-id';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse, IGetAllUsers } from '../interfaces/iget-all-users';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserControllerServiceService {

  constructor(private http: HttpClient) { }
  GetAllUsersUrl=`/Account`;
  toggleUserStatusUrl=`/Account/AccountSuspension`;
  GetUserByIdUrl=`/Account`

getAllUsers(perPage: number = 5, page: number = 1): Observable<ApiResponse<IGetAllUsers[]>> {
    const params = new HttpParams()
      .set('perPage', perPage)
      .set('page', page);

    return this.http.get<ApiResponse<IGetAllUsers[]>>(`${this.GetAllUsersUrl}/GetAllUsers`, { params });
  }
 toggleUserStatus(userId: string) {
  return this.http.post<{ message: string; isActive: boolean }>(
    `${this.toggleUserStatusUrl}/${userId}`, {}
  );
}

 getUser(userId: number): Observable<IGetUserById> {
    return this.http.get<IGetUserById>(`${this.GetUserByIdUrl}/GetUser/${userId}`);
  }
}
