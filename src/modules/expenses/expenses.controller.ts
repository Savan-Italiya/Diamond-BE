import { Request, Response, NextFunction } from 'express';
import { ExpensesService } from './expenses.service';

export class ExpensesController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const { from_date, to_date, category } = req.query as Record<string, string>;
      const rows = await ExpensesService.getExpenses({ user_id: userId, from_date, to_date, category });
      return res.json({ success: true, data: rows });
    } catch (e) { next(e); }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const orgId  = (req as any).user?.organization_id;
      const row = await ExpensesService.createExpense({ ...req.body, user_id: userId, organization_id: orgId });
      return res.status(201).json({ success: true, data: row });
    } catch (e) { next(e); }
  }

  public static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const ok = await ExpensesService.deleteExpense(req.params.id, userId);
      if (!ok) return res.status(404).json({ success: false, message: 'Not found or unauthorized' });
      return res.json({ success: true, message: 'Deleted' });
    } catch (e) { next(e); }
  }

  public static async summary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const { from_date, to_date } = req.query as Record<string, string>;
      const data = await ExpensesService.getSummary({ user_id: userId, from_date, to_date });
      return res.json({ success: true, data });
    } catch (e) { next(e); }
  }
}
