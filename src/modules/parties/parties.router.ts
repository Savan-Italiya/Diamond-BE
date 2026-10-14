import { Router } from 'express';
import { PartiesController } from './parties.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createPartySchema, updatePartySchema } from './parties.dto';
import { auditLogger } from '../../middleware/audit.middleware';

const router = Router();

router.use(authenticate);

router.get('/', PartiesController.getAll);
router.get('/:id', PartiesController.getById);

router.post(
  '/',
  requirePermission('PARTY_MANAGE'),
  validateRequest({ body: createPartySchema }),
  auditLogger('parties'),
  PartiesController.create
);

router.patch(
  '/:id',
  requirePermission('PARTY_MANAGE'),
  validateRequest({ body: updatePartySchema }),
  auditLogger('parties'),
  PartiesController.update
);

export default router;
