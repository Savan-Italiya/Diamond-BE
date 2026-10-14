import { Request, Response, NextFunction } from 'express';
export declare class AccountingController {
    static getLedger(req: Request, res: Response, next: NextFunction): Promise<void>;
    static recordReceipt(req: Request, res: Response, next: NextFunction): Promise<void>;
    static recordSupplierPayment(req: Request, res: Response, next: NextFunction): Promise<void>;
}
