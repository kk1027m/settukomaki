import { Request, Response } from 'express';
export declare const handleWebhook: (req: Request, res: Response) => Promise<void>;
export declare const runNotificationCron: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const triggerNotification: (req: Request, res: Response) => Promise<void>;
export declare const getLineStatus: (req: Request, res: Response) => Promise<void>;
export declare const testLineConnection: (req: Request, res: Response) => Promise<void>;
export declare const deleteLineRecipient: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=lineController.d.ts.map