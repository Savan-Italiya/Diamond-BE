import { Request, Response, NextFunction } from 'express';
import { SalesService } from './sales.service';

export class SalesController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { buyer_id, deal_status } = req.query;
      const orders = await SalesService.getAllSalesOrders({
        buyer_id: buyer_id as string,
        deal_status: deal_status as string
      });
      res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await SalesService.createSalesOrder(req.body);
      res.status(201).json({ success: true, message: 'Sales order registered and ledger debited', data: order });
    } catch (err) {
      next(err);
    }
  }

  public static async getDebtorsAgeing(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ageing = await SalesService.getDebtorsAgeingAnalysis();
      res.status(200).json({ success: true, data: ageing });
    } catch (err) {
      next(err);
    }
  }
}
