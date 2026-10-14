import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required before role verification.', code: 'UNAUTHORIZED' }
      });
      return;
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole && !req.user.roles.includes('SUPER_ADMIN')) {
      res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`,
          code: 'FORBIDDEN'
        }
      });
      return;
    }

    next();
  };
}

export function requirePermission(requiredPermission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required before permission verification.', code: 'UNAUTHORIZED' }
      });
      return;
    }

    if (req.user.roles.includes('SUPER_ADMIN')) {
      return next();
    }

    if (!req.user.permissions.includes(requiredPermission)) {
      res.status(403).json({
        success: false,
        error: {
          message: `Forbidden. Missing permission: ${requiredPermission}`,
          code: 'FORBIDDEN'
        }
      });
      return;
    }

    next();
  };
}
