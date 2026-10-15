import { Router } from 'express';
import { OrganizationsController } from './organizations.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createOrganizationSchema, addMemberSchema, updateMemberStatusSchema } from './organizations.dto';
import { auditLogger } from '../../middleware/audit.middleware';

const router = Router();

router.use(authenticate);

router.get('/my', OrganizationsController.getMyOrg);
router.post(
  '/',
  validateRequest({ body: createOrganizationSchema }),
  auditLogger('organizations'),
  OrganizationsController.createOrUpdate
);

router.get('/members', OrganizationsController.getMembers);
router.post(
  '/members',
  validateRequest({ body: addMemberSchema }),
  auditLogger('users'),
  OrganizationsController.addMember
);
router.patch(
  '/members/:id/status',
  validateRequest({ body: updateMemberStatusSchema }),
  auditLogger('users'),
  OrganizationsController.updateMemberStatus
);

export default router;
