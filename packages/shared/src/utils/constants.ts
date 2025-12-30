export const USER_ROLES = {
  ADMIN: 'admin' as const,
  USER: 'user' as const,
};

export const NOTIFICATION_TYPES = {
  LUBRICATION_DUE: 'lubrication_due' as const,
  LUBRICATION_OVERDUE: 'lubrication_overdue' as const,
  LOW_STOCK: 'low_stock' as const,
  ORDER_REQUEST: 'order_request' as const,
};

export const PART_ACTION_TYPES = {
  RECEIVE: '入庫' as const,
  ISSUE: '出庫' as const,
  ADJUST: '調整' as const,
  ORDER: '発注' as const,
};

export const ALERT_THRESHOLDS = {
  OVERDUE: 0,
  DUE_SOON: 3,
  UPCOMING: 7,
  NORMAL: 14,
};

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'],
};
