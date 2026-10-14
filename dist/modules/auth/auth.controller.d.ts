import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
export declare class AuthController {
    static login(req: Request, res: Response, next: NextFunction): Promise<void>;
    static register(req: Request, res: Response, next: NextFunction): Promise<void>;
    static me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
