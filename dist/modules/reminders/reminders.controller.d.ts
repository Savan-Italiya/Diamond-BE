import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
export declare class RemindersController {
    static getDailyQueue(_req: Request, res: Response, next: NextFunction): Promise<void>;
    static logFollowUp(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    static updatePromisedDate(req: Request, res: Response, next: NextFunction): Promise<void>;
    static triggerDailyJob(_req: Request, res: Response, next: NextFunction): Promise<void>;
}
