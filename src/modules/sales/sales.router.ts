import { Router } from 'express';
import { SalesController } from './sales.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createSalesOrderSchema } from './sales.dto';
import { auditLogger } from '../../middleware/audit.middleware';

const router = Router();

router.use(authenticate);

// List & Analytics
router.get('/', SalesController.getAll);
router.get('/debtors-ageing', SalesController.getDebtorsAgeing);
router.get('/my-stats', SalesController.getMyStats);
router.get('/:id/payments', SalesController.paymentHistory);

// Create sales order
router.post(
  '/',
  requirePermission('SALES_CREATE'),
  validateRequest({ body: createSalesOrderSchema }),
  auditLogger('sales_orders'),
  SalesController.create
);

// Payment lifecycle actions
router.post('/:id/mark-paid', requirePermission('SALES_CREATE'), auditLogger('payment_receipts'), SalesController.markPaid);
router.post('/:id/partial-payment', requirePermission('SALES_CREATE'), auditLogger('payment_receipts'), SalesController.partialPayment);
router.post('/:id/reschedule', requirePermission('SALES_CREATE'), auditLogger('payment_schedules'), SalesController.reschedule);

export default router;
