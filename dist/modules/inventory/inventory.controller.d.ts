import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
export declare class InventoryController {
    static getLots(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getSingleDiamonds(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createLot(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createSingleDiamond(req: Request, res: Response, next: NextFunction): Promise<void>;
    static breakdownLot(req: Request, res: Response, next: NextFunction): Promise<void>;
    static stockAudit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    static getSummary(_req: Request, res: Response, next: NextFunction): Promise<void>;
}
