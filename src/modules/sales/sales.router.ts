import { Router } from 'express';
import { SalesController } from './sales.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createSalesOrderSchema } from './sales.dto';
import { auditLogger } from '../../middleware/audit.middleware';

const router = Router();

router.use(authenticate);

router.get('/', SalesController.getAll);
router.get('/debtors-ageing', SalesController.getDebtorsAgeing);

router.post(
  '/',
  requirePermission('SALES_CREATE'),
  validateRequest({ body: createSalesOrderSchema }),
  auditLogger('sales_orders'),
  SalesController.create
);

export default router;
