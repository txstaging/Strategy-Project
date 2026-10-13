export interface NotificationItem {
    id: number;
    message: string;
    isRead: boolean;
    formNameToReturnToFront: string;
    planId: number;
    createdAt?: string;
  }
  
  export interface NotificationResponse {
    count: number;
    notifications: NotificationItem[];
  }