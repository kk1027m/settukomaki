import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getTroubleshootingItems: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getTroubleshootingItemById: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const createTroubleshootingItem: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateTroubleshootingItem: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const deleteTroubleshootingItem: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateTroubleshootingSortOrder: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getMachineNames: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getUnitNames: (req: AuthRequest, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=troubleshootingController.d.ts.map