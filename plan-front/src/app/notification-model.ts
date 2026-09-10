export interface NotificationModel {
  id?: number;
  message: string;
  createdAt: Date;
  isRead: boolean;
  formNameToReturnToFront?: string;
  planId?: number;
}
