import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { loginSchema, registerUserSchema } from './auth.dto';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

const router = Router();

router.post('/login', validateRequest({ body: loginSchema }), AuthController.login);
router.post(
  '/register',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  validateRequest({ body: registerUserSchema }),
  AuthController.register
);
router.get('/me', authenticate, AuthController.me);

export default router;
