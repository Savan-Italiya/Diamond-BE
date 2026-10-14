import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { AuthenticatedRequest } from '../../types';

export class InventoryController {
  public static async getLots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, search } = req.query;
      const lots = await InventoryService.getLots({
        status: status as string,
        search: search as string
      });
      res.status(200).json({ success: true, count: lots.length, data: lots });
    } catch (err) {
      next(err);
    }
  }

  public static async getSingleDiamonds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const diamonds = await InventoryService.getSingleDiamonds(req.query as any);
      res.status(200).json({ success: true, count: diamonds.length, data: diamonds });
    } catch (err) {
      next(err);
    }
  }

  public static async createLot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lot = await InventoryService.createLot(req.body);
      res.status(201).json({ success: true, message: 'Lot created successfully', data: lot });
    } catch (err) {
      next(err);
    }
  }

  public static async createSingleDiamond(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const diamond = await InventoryService.createSingleDiamond(req.body);
      res.status(201).json({ success: true, message: 'Certified diamond created successfully', data: diamond });
    } catch (err) {
      next(err);
    }
  }

  public static async breakdownLot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { parent_lot_id, new_lot_number, carats_transferred, cost_per_carat } = req.body;
      const result = await InventoryService.breakdownLot(
        parent_lot_id,
        new_lot_number,
        carats_transferred,
        cost_per_carat
      );
      res.status(200).json({ success: true, message: 'Lot breakdown executed successfully', data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async stockAudit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const auditLog = await InventoryService.recordStockAudit({
        ...req.body,
        checked_by: req.user?.userId
      });
      res.status(201).json({ success: true, message: 'Stock audit logged successfully', data: auditLog });
    } catch (err) {
      next(err);
    }
  }

  public static async getSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await InventoryService.getStockSummary();
      res.status(200).json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }
}
