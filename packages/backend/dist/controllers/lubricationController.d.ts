import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getLubricationPoints: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getLubricationPointById: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const createLubricationPoint: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateLubricationPoint: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const deleteLubricationPoint: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const performLubrication: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getLubricationRecords: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getAlerts: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateLubricationSortOrder: (req: AuthRequest, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=lubricationController.d.ts.map