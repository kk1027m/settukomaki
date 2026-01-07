import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getParts: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getPartById: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const createPart: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updatePart: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const deletePart: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const adjustStock: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getPartHistory: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const orderRequest: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getLowStockParts: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getOrderRequests: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateSortOrder: (req: AuthRequest, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=partController.d.ts.map