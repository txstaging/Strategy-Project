import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IAddVisionResponse } from '../interfaces/IAddVisionBody';
import { IDeleteVisionResponse } from '../interfaces/IDeleteVisionResponse';
import { IGetAllVisionsResponse } from '../interfaces/IGetAllVisions';
import { IGetVisionByIdResponse } from '../interfaces/IGetVisionById';
import { IUpdateAllVisionStatusResponse } from '../interfaces/IUpdateAllVisionStatusResponse';
import { IUpdateVisionResponse } from '../interfaces/IUpdateVisionBody';


@Injectable({
  providedIn: 'root',
})
export class VisionService {

  private readonly http = inject(HttpClient)



getAllVisions() {
  return this.http.get<IGetAllVisionsResponse>('/OurVision')
}

getAllVisionsAdmin() {
  return this.http.get<IGetAllVisionsResponse>('/OurVision/v2')
}

addVision(visionData: FormData) {
  return this.http.post<IAddVisionResponse>('/OurVision', visionData)
}

getVisionById(id: number) {
  return this.http.get<IGetVisionByIdResponse>(`/OurVision/${id}`)
}

markAllVisionStatusFalse() {
  return this.http.post<IUpdateAllVisionStatusResponse>('/OurVision/UpdateAllStatus', { Status: false })
}

updateVision( visionData: FormData) {
  return this.http.post<IUpdateVisionResponse>(`/OurVision`, visionData)
}

updateVisionStatus(visionId: number, status: boolean) {
  const FD = new FormData();
  FD.append('Id', visionId.toString());
  FD.append('Status', status.toString());
  return this.http.post<IUpdateVisionResponse>(`/OurVision`, FD)
}

deleteVision(id: number) {
  return this.http.delete<IDeleteVisionResponse>(`/OurVision/${id}`)
}
}
