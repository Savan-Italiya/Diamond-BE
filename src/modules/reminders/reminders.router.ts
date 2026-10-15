import { Router } from 'express';
import { RemindersController } from './reminders.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { logFollowUpSchema, updateSchedulePromiseSchema } from './reminders.dto';
import { auditLogger } from '../../middleware/audit.middleware';

const router = Router();

router.use(authenticate);

router.get('/daily-queue', RemindersController.getDailyQueue);

router.post(
  '/follow-up',
  requirePermission('FOLLOWUP_DIAL'),
  validateRequest({ body: logFollowUpSchema }),
  auditLogger('follow_up_logs'),
  RemindersController.logFollowUp
);

router.post(
  '/promise-date',
  requirePermission('FOLLOWUP_DIAL'),
  validateRequest({ body: updateSchedulePromiseSchema }),
  auditLogger('payment_schedules'),
  RemindersController.updatePromisedDate
);

router.post(
  '/run-job',
  requirePermission('SUPER_ADMIN'),
  RemindersController.triggerDailyJob
);

router.get('/history',           RemindersController.getFollowUpHistory);
router.post('/:schedule_id/done', RemindersController.markCallDone);
router.get('/dashboard-stats',   RemindersController.getDashboardStats);

export default router;
