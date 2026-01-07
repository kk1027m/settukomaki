import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getReplacementSchedules: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getReplacementScheduleById: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const createReplacementSchedule: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateReplacementSchedule: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const deleteReplacementSchedule: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const performReplacement: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getReplacementRecords: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getAlerts: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateReplacementSortOrder: (req: AuthRequest, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=replacementController.d.ts.map