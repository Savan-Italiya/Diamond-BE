import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
export declare class MemoController {
    static getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    static create(req: Request, res: Response, next: NextFunction): Promise<void>;
    static returnItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
