import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
export declare function requireRole(allowedRoles: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function requirePermission(requiredPermission: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
