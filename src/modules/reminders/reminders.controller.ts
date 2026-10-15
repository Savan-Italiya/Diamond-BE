import { Request, Response, NextFunction } from 'express';
import { RemindersService } from './reminders.service';
import { AuthenticatedRequest } from '../../types';

export class RemindersController {
  public static async getDailyQueue(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queue = await RemindersService.getDailyFollowUpQueue();
      res.status(200).json({ success: true, count: queue.length, data: queue });
    } catch (err) {
      next(err);
    }
  }

  public static async logFollowUp(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await RemindersService.logFollowUp({
        ...req.body,
        caller_user_id: req.user?.userId
      });
      res.status(201).json({ success: true, message: 'Follow-up call logged', data: log });
    } catch (err) {
      next(err);
    }
  }

  public static async updatePromisedDate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { schedule_id, promised_date } = req.body;
      const updated = await RemindersService.updatePromisedDate(schedule_id, promised_date);
      res.status(200).json({ success: true, message: 'Promised date recorded', data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async triggerDailyJob(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await RemindersService.runDailyReminderJob();
      res.status(200).json({ success: true, message: `Daily reminders processed (${count} new alerts)` });
    } catch (err) {
      next(err);
    }
  }

  public static async getFollowUpHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { party_id, limit } = req.query as Record<string, string>;
      const logs = await RemindersService.getFollowUpHistory(party_id, limit ? parseInt(limit) : 50);
      res.json({ success: true, data: logs });
    } catch (err) { next(err); }
  }

  public static async markCallDone(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { schedule_id } = req.params;
      const result = await RemindersService.markCallDone(schedule_id, {
        ...req.body,
        caller_user_id: req.user?.userId
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  public static async getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await RemindersService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (err) { next(err); }
  }
}
