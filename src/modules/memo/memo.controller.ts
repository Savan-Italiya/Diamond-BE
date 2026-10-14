import { Request, Response, NextFunction } from 'express';
import { MemoService } from './memo.service';
import { AuthenticatedRequest } from '../../types';

export class MemoController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { party_id, status, type } = req.query;
      const memos = await MemoService.getAllMemos({
        party_id: party_id as string,
        status: status as string,
        type: type as string
      });
      res.status(200).json({ success: true, count: memos.length, data: memos });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memo = await MemoService.getMemoById(req.params.id);
      res.status(200).json({ success: true, data: memo });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memo = await MemoService.createMemo(req.body);
      res.status(201).json({ success: true, message: 'Memo challan created successfully', data: memo });
    } catch (err) {
      next(err);
    }
  }

  public static async returnItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { memo_item_id, returned_carat, condition_notes } = req.body;
      const result = await MemoService.returnMemoItem(
        memo_item_id,
        returned_carat,
        req.user?.userId,
        condition_notes
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
