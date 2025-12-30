export interface Notification {
  id: number;
  user_id: number | null;
  type: 'lubrication_due' | 'lubrication_overdue' | 'low_stock' | 'order_request';
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: number | null;
  is_read: boolean;
  is_sent: boolean;
  sent_at: Date | null;
  created_at: Date;
}

export interface PushSubscription {
  id: number;
  user_id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNotificationDto {
  user_id?: number;
  type: Notification['type'];
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: number;
}

export interface SubscribePushDto {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  tag?: string;
}
