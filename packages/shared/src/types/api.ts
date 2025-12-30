export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  urgent_lubrication_count: number;
  upcoming_lubrication_count: number;
  low_stock_parts_count: number;
  unread_notifications_count: number;
  recent_lubrication_records: any[];
  low_stock_alerts: any[];
}
