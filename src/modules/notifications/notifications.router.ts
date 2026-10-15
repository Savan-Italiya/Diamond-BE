import { Router, Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/templates', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await NotificationsService.getTemplates();
    res.status(200).json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
});

router.post('/queue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queued = await NotificationsService.queueNotification(req.body);
    res.status(201).json({ success: true, data: queued });
  } catch (err) {
    next(err);
  }
});

router.post('/send-sms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await NotificationsService.sendSmsNotification(req.body);
    res.status(200).json({
      success: true,
      message: `SMS reminder sent to registered number ${req.body.phone}`,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

router.get('/sms-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { party_id } = req.query;
    const logs = await NotificationsService.getSmsLogs(party_id as string);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
});

export default router;
