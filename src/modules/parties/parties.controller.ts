import { Request, Response, NextFunction } from 'express';
import { PartiesService } from './parties.service';

export class PartiesController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, search } = req.query;
      const parties = await PartiesService.getAllParties({
        type: type as string,
        search: search as string
      });
      res.status(200).json({
        success: true,
        count: parties.length,
        data: parties
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const party = await PartiesService.getPartyById(req.params.id);
      res.status(200).json({
        success: true,
        data: party
      });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newParty = await PartiesService.createParty(req.body);
      res.status(201).json({
        success: true,
        message: 'Party created successfully',
        data: newParty
      });
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await PartiesService.updateParty(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Party updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
}
