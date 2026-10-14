import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
export declare function auditLogger(tableName: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
