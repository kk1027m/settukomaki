import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getInquiries: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const createInquiry: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateInquiryStatus: (req: AuthRequest, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=inquiriesController.d.ts.map