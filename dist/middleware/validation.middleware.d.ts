import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
export declare function validateRequest(schema: {
    body?: AnyZodObject;
    query?: AnyZodObject;
    params?: AnyZodObject;
}): (req: Request, res: Response, next: NextFunction) => Promise<void>;
