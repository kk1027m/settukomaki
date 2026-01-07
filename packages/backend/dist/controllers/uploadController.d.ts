import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const uploadFile: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getFile: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getAttachmentsByEntity: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const deleteFile: (req: AuthRequest, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=uploadController.d.ts.map