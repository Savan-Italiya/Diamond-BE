import { Request, Response, NextFunction } from 'express';
import { SalesService } from './sales.service';

export class SalesController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { buyer_id, deal_status, my_only } = req.query;
      const currentUserId = (req as any).user?.id;
      const orders = await SalesService.getAllSalesOrders({
        buyer_id: buyer_id as string,
        deal_status: deal_status as string,
        user_id: my_only === 'true' && currentUserId ? currentUserId : undefined
      });
      res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || 'admin-1';
      const order = await SalesService.createSalesOrder({
        ...req.body,
        created_by_user_id: userId
      });
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

  public static async getMyStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await SalesService.getMyStats();
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  public static async markPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || 'system';
      const result = await SalesService.markPaymentComplete(id, userId);
      res.status(200).json({ success: true, message: `Invoice ${result.invoice_number} marked as PAID. ₹${result.amount_paid.toLocaleString('en-IN')} credited to ledger.`, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async partialPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || 'system';
      const result = await SalesService.recordPartialPayment({ sales_order_id: id, user_id: userId, ...req.body });
      res.status(201).json({ success: true, message: `Partial payment of ₹${result.amount_received.toLocaleString('en-IN')} recorded. Remaining: ₹${result.remaining_balance.toLocaleString('en-IN')}`, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async reschedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || 'system';
      const result = await SalesService.reschedulePaymentDate({ sales_order_id: id, user_id: userId, ...req.body });
      res.status(200).json({ success: true, message: `Payment rescheduled to ${result.new_promised_date}. Follow-up reminder created.`, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async paymentHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await SalesService.getPaymentHistory(id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
