import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import {
  createLotSchema,
  createSingleDiamondSchema,
  lotBreakdownSchema,
  stockAuditSchema
} from './inventory.dto';
import { auditLogger } from '../../middleware/audit.middleware';

const router = Router();

router.use(authenticate);

router.get('/summary', InventoryController.getSummary);
router.get('/lots', InventoryController.getLots);
router.get('/diamonds', InventoryController.getSingleDiamonds);

router.post(
  '/lots',
  requirePermission('INVENTORY_MANAGE'),
  validateRequest({ body: createLotSchema }),
  auditLogger('diamond_lots'),
  InventoryController.createLot
);

router.post(
  '/diamonds',
  requirePermission('INVENTORY_MANAGE'),
  validateRequest({ body: createSingleDiamondSchema }),
  auditLogger('single_diamonds'),
  InventoryController.createSingleDiamond
);

router.post(
  '/lots/breakdown',
  requirePermission('INVENTORY_MANAGE'),
  validateRequest({ body: lotBreakdownSchema }),
  auditLogger('lot_breakdown_history'),
  InventoryController.breakdownLot
);

router.post(
  '/audit',
  requirePermission('STOCK_AUDIT'),
  validateRequest({ body: stockAuditSchema }),
  auditLogger('stock_audit_logs'),
  InventoryController.stockAudit
);

export default router;
