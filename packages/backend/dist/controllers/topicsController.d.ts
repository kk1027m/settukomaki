import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createNotificationTopic: (title: string, content: string, userId: number, entityType?: string, entityId?: number) => Promise<void>;
export declare const getTopics: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getTopic: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const createTopic: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateTopic: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const deleteTopic: (req: AuthRequest, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=topicsController.d.ts.map