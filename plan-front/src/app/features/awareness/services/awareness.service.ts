import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IAddAwarenessResponse } from '../interfaces/IAddAwarenessBody';
import { IDeleteAwarenessResponse } from '../interfaces/IDeleteAwarenessResponse';
import { IGetAllAwarenessResponse } from '../interfaces/IGetAllAwareness';
import { IGetAwarenessByIdResponse } from '../interfaces/IGetAwarenessById';
import { IUpdateAllAwarenessStatusResponse } from '../interfaces/IUpdateAllAwarenessStatusResponse';
import { IUpdateAwarenessResponse } from '../interfaces/IUpdateAwarenessBody';


@Injectable({
  providedIn: 'root',
})
export class AwarenessService {

  private readonly http = inject(HttpClient)



getAllAwareness() {
  return this.http.get<IGetAllAwarenessResponse>('/Awareness')
}

getAllAwarenessAdmin() {
  return this.http.get<IGetAllAwarenessResponse>('/Awareness/v2')
}

addAwareness(awarenessData: FormData) {
  return this.http.post<IAddAwarenessResponse>('/Awareness', awarenessData)
}

getAwarenessById(id: number) {
  return this.http.get<IGetAwarenessByIdResponse>(`/Awareness/${id}`)
}

markAllAwarenessStatusFalse() {
  return this.http.post<IUpdateAllAwarenessStatusResponse>('/Awareness/UpdateAllStatus', { Status: false })
}

updateAwareness( awarenessData: FormData) {
  return this.http.post<IUpdateAwarenessResponse>(`/Awareness`, awarenessData)
}

updateAwarenessStatus(awarenessId: number, status: boolean) {
  const FD = new FormData();
  FD.append('Id', awarenessId.toString());
  FD.append('Status', status.toString());
  return this.http.post<IUpdateAwarenessResponse>(`/Awareness`, FD)
}

deleteAwareness(id: number) {
  return this.http.delete<IDeleteAwarenessResponse>(`/Awareness/${id}`)
}
}
