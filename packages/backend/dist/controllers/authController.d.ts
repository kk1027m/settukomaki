import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const login: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getMe: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const changePassword: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const refreshAccessToken: (req: AuthRequest, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map