import { Router } from 'express';
import { MemoController } from './memo.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createMemoBillSchema, returnMemoItemSchema } from './memo.dto';
import { auditLogger } from '../../middleware/audit.middleware';

const router = Router();

router.use(authenticate);

router.get('/', MemoController.getAll);
router.get('/:id', MemoController.getById);

router.post(
  '/',
  requirePermission('MEMO_ISSUE'),
  validateRequest({ body: createMemoBillSchema }),
  auditLogger('memo_bills'),
  MemoController.create
);

router.post(
  '/return',
  requirePermission('MEMO_RETURN'),
  validateRequest({ body: returnMemoItemSchema }),
  auditLogger('memo_return_logs'),
  MemoController.returnItem
);

export default router;
