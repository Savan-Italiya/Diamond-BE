import { Request, Response, NextFunction } from 'express';
import { AccountingService } from './accounting.service';

export class AccountingController {
  public static async getLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { party_id } = req.params;
      const { start_date, end_date } = req.query;
      const ledger = await AccountingService.getPartyLedger(
        party_id,
        start_date as string,
        end_date as string
      );
      res.status(200).json({ success: true, data: ledger });
    } catch (err) {
      next(err);
    }
  }

  public static async recordReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AccountingService.recordPaymentReceipt(req.body);
      res.status(201).json({ success: true, message: 'Payment receipt recorded and Khata updated', data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async recordSupplierPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AccountingService.recordSupplierPayment(req.body);
      res.status(201).json({ success: true, message: 'Supplier payment recorded and Khata debited', data: result });
    } catch (err) {
      next(err);
    }
  }
}
