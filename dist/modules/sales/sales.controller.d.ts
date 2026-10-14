import { Request, Response, NextFunction } from 'express';
export declare class SalesController {
    static getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
    static create(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getDebtorsAgeing(_req: Request, res: Response, next: NextFunction): Promise<void>;
}
