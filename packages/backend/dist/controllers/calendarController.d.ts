import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getEvents: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getDayColors: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const createEvent: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateEvent: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const deleteEvent: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const setDayColor: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getWeekShifts: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateWeekShift: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getLeaves: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const createLeave: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const deleteLeave: (req: AuthRequest, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=calendarController.d.ts.map