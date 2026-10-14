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

export default router;
