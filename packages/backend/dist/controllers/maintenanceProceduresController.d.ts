import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getProcedures: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getProcedure: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const createProcedure: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateProcedure: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const deleteProcedure: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const createComment: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const deleteComment: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getMachineNames: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getUnitNames: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateProcedureSortOrder: (req: AuthRequest, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=maintenanceProceduresController.d.ts.map