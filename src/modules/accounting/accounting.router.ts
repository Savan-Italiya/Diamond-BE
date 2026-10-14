import { Router } from 'express';
import { AccountingController } from './accounting.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createPaymentReceiptSchema, createSupplierPaymentSchema } from './accounting.dto';
import { auditLogger } from '../../middleware/audit.middleware';

const router = Router();

router.use(authenticate);

router.get('/ledger/:party_id', AccountingController.getLedger);

router.post(
  '/receipts',
  requirePermission('PAYMENT_MANAGE'),
  validateRequest({ body: createPaymentReceiptSchema }),
  auditLogger('payment_receipts'),
  AccountingController.recordReceipt
);

router.post(
  '/supplier-payments',
  requirePermission('PAYMENT_MANAGE'),
  validateRequest({ body: createSupplierPaymentSchema }),
  auditLogger('supplier_payments'),
  AccountingController.recordSupplierPayment
);

export default router;
