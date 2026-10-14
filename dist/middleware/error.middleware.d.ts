import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    constructor(message: string, statusCode?: number, code?: string);
}
export declare function errorHandler(err: Error | AppError, req: Request, res: Response, _next: NextFunction): void;
