import { Request, Response, NextFunction } from 'express';
import { ProcessingService } from './processing.service';

export class ProcessingController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { processor_party_id, status } = req.query;
      const slips = await ProcessingService.getAllSlips({
        processor_party_id: processor_party_id as string,
        status: status as string
      });
      res.status(200).json({ success: true, count: slips.length, data: slips });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slip = await ProcessingService.createRepairSlip(req.body);
      res.status(201).json({ success: true, message: 'Repair issue slip created', data: slip });
    } catch (err) {
      next(err);
    }
  }

  public static async returnItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const returnSlip = await ProcessingService.returnRepairItem(req.body);
      res.status(200).json({ success: true, message: 'Repair return recorded with carat loss', data: returnSlip });
    } catch (err) {
      next(err);
    }
  }
}
