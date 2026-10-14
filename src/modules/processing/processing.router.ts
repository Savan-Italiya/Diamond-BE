import { Router } from 'express';
import { ProcessingController } from './processing.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createRepairSlipSchema, returnRepairSlipSchema } from './processing.dto';
import { auditLogger } from '../../middleware/audit.middleware';

const router = Router();

router.use(authenticate);

router.get('/', ProcessingController.getAll);

router.post(
  '/',
  requirePermission('KARKHANA_MANAGE'),
  validateRequest({ body: createRepairSlipSchema }),
  auditLogger('repair_issue_slips'),
  ProcessingController.create
);

router.post(
  '/return',
  requirePermission('KARKHANA_MANAGE'),
  validateRequest({ body: returnRepairSlipSchema }),
  auditLogger('repair_return_slips'),
  ProcessingController.returnItem
);

export default router;
