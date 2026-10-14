import { Router, Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

const router = Router();
router.use(authenticate);

router.get('/logs', requireRole(['SUPER_ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { table_name, record_id, user_id } = req.query;
    const logs = await AuditService.getLogs({
      table_name: table_name as string,
      record_id: record_id as string,
      user_id: user_id as string
    });
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
});

router.get('/report-schedules', requireRole(['SUPER_ADMIN']), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const schedules = await AuditService.getReportSchedules();
    res.status(200).json({ success: true, data: schedules });
  } catch (err) {
    next(err);
  }
});

router.post('/report-schedules', requireRole(['SUPER_ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedule = await AuditService.createReportSchedule(req.body);
    res.status(201).json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
});

export default router;
