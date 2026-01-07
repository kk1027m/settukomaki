import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getUsers: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getUserById: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const createUser: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateUser: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const deleteUser: (req: AuthRequest, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=userController.d.ts.map