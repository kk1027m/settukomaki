import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getNotifications: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getUnreadCount: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const markAsRead: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const markAllAsRead: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const deleteNotification: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const subscribePush: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const unsubscribePush: (req: AuthRequest, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=notificationController.d.ts.map