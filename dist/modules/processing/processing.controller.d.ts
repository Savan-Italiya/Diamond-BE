import { Request, Response, NextFunction } from 'express';
export declare class ProcessingController {
    static getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
    static create(req: Request, res: Response, next: NextFunction): Promise<void>;
    static returnItem(req: Request, res: Response, next: NextFunction): Promise<void>;
}
