import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IAddMessageResponse } from '../interfaces/IAddMessageBody';
import { IDeleteMessageResponse } from '../interfaces/IDeleteMessageResponse';
import { IGetAllMessagesResponse } from '../interfaces/IGetAllMessages';
import { IGetMessageByIdResponse } from '../interfaces/IGetMessageById';
import { IUpdateAllMessageStatusResponse } from '../interfaces/IUpdateAllMessageStatusResponse';
import { IUpdateMessageResponse } from '../interfaces/IUpdateMessageBody';


@Injectable({
  providedIn: 'root',
})
export class MessageService {

  private readonly http = inject(HttpClient)



getAllMessages() {
  return this.http.get<IGetAllMessagesResponse>('/OurMessages')
}

getAllMessagesAdmin() {
  return this.http.get<IGetAllMessagesResponse>('/OurMessages/v2')
}

addMessage(messageData: FormData) {
  return this.http.post<IAddMessageResponse>('/OurMessages', messageData)
}

getMessageById(id: number) {
  return this.http.get<IGetMessageByIdResponse>(`/OurMessages/${id}`)
}

markAllMessageStatusFalse() {
  return this.http.post<IUpdateAllMessageStatusResponse>('/OurMessages/UpdateAllStatus', { Status: false })
}

updateMessage( messageData: FormData) {
  return this.http.post<IUpdateMessageResponse>(`/OurMessages`, messageData)
}

updateMessageStatus(messageId: number, status: boolean) {
  const FD = new FormData();
  FD.append('Id', messageId.toString());
  FD.append('Status', status.toString());
  return this.http.post<IUpdateMessageResponse>(`/OurMessages`, FD)
}

deleteMessage(id: number) {
  return this.http.delete<IDeleteMessageResponse>(`/OurMessages/${id}`)
}
}
