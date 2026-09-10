export interface NotificationItem {
    id: number;
    message: string;
    isRead: boolean;
    formNameToReturnToFront: string;
    planId: number;
  }
  
  export interface NotificationResponse {
    count: number;
    notifications: NotificationItem[];
  }