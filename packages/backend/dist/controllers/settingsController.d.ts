import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getSettings: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getSetting: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateSetting: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateMultipleSettings: (req: AuthRequest, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=settingsController.d.ts.map