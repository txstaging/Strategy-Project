import { ICreateUser } from '../interfaces/icreate-user';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ICreateUnit } from '../interfaces/icreate-unit';
import { IUpdateUser } from '../interfaces/iupdate-user';

@Injectable({
  providedIn: 'root',
})
export class CreateUserServiceService {
  constructor(private http: HttpClient) {}

  CreateUserUrl = `/User`;
  CreateUnitUrl = `/Units`;

  CreateUser(obj: ICreateUser): Observable<any> {
    return this.http.post<any>('/Account/register/v2', obj);
  }
  UpdateUser(obj: IUpdateUser): Observable<any> {
    return this.http.post<any>(`/Account/UpdateUser/${obj.UserId}`, obj);
  }
  CreateUnit(UnitName: ICreateUnit): Observable<any> {
    return this.http.post<any>(this.CreateUnitUrl, UnitName);
  }
}
