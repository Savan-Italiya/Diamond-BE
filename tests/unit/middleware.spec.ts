import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../src/middleware/auth.middleware';
import { requireRole, requirePermission } from '../../src/middleware/rbac.middleware';
import { validateRequest } from '../../src/middleware/validation.middleware';
import { errorHandler, AppError } from '../../src/middleware/error.middleware';
import { auditLogger } from '../../src/middleware/audit.middleware';
import { config } from '../../src/config/env';
import { z } from 'zod';

jest.mock('../../src/database/connection', () => {
  const insertMock = jest.fn().mockReturnValue({
    catch: jest.fn()
  });
  const dbMock: any = jest.fn(() => ({
    insert: insertMock
  }));
  return { db: dbMock };
});

describe('Backend Middleware Unit Tests', () => {
  let req: any;
  let res: any;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      params: {},
      body: {},
      method: 'GET',
      socket: { remoteAddress: '127.0.0.1' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      statusCode: 200
    };
    next = jest.fn();
  });

  describe('Auth Middleware', () => {
    it('should return 401 if Authorization header is missing', () => {
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'UNAUTHORIZED' })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should set req.user and call next if token is valid', () => {
      const payload = { userId: '123', name: 'Tester', email: 'test@bkc.com', roles: ['TRADER'], permissions: [] };
      const token = jwt.sign(payload, config.jwt.secret);
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('123');
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      req.headers.authorization = 'Bearer invalid-token';
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'INVALID_TOKEN' })
        })
      );
    });
  });

  describe('RBAC Middleware', () => {
    it('should return 401 if req.user is missing in requireRole', () => {
      const middleware = requireRole(['SUPER_ADMIN']);
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should allow access if role matches', () => {
      req.user = { roles: ['DIAMOND_TRADER'], permissions: [] };
      const middleware = requireRole(['DIAMOND_TRADER', 'ACCOUNTANT']);
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should allow access if user is SUPER_ADMIN even if role not explicitly in list', () => {
      req.user = { roles: ['SUPER_ADMIN'], permissions: [] };
      const middleware = requireRole(['ACCOUNTANT']);
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should deny access if role does not match', () => {
      req.user = { roles: ['BROKER'], permissions: [] };
      const middleware = requireRole(['ACCOUNTANT']);
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should allow permission if present in permissions list', () => {
      req.user = { roles: ['TRADER'], permissions: ['MEMO_ISSUE'] };
      const middleware = requirePermission('MEMO_ISSUE');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should allow permission if user is SUPER_ADMIN', () => {
      req.user = { roles: ['SUPER_ADMIN'], permissions: [] };
      const middleware = requirePermission('RANDOM_PERM');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should deny permission if missing', () => {
      req.user = { roles: ['TRADER'], permissions: ['OTHER_PERM'] };
      const middleware = requirePermission('MEMO_ISSUE');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Validation Middleware', () => {
    const testSchema = z.object({
      name: z.string().min(3),
      carat: z.number().positive()
    });

    it('should pass validation with valid body', async () => {
      req.body = { name: 'Parcel A', carat: 10.5 };
      const middleware = validateRequest({ body: testSchema });
      await middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 400 with validation details when body is invalid', async () => {
      req.body = { name: 'A', carat: -5 };
      const middleware = validateRequest({ body: testSchema });
      await middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'VALIDATION_ERROR' })
        })
      );
    });
  });

  describe('Audit Logger Middleware', () => {
    it('should attach interceptor and call next', () => {
      req.method = 'POST';
      req.body = { test: true };
      const middleware = auditLogger('parties');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();

      // Trigger interceptor
      res.json({ success: true, data: { id: 'party-1' } });
      expect(res.json).toBeDefined();
    });
  });

  describe('Error Handler Middleware', () => {
    it('should format AppError correctly', () => {
      const err = new AppError('Custom business error', 400, 'CUSTOM_CODE');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Custom business error',
            code: 'CUSTOM_CODE'
          })
        })
      );
    });

    it('should format standard Error as 500', () => {
      const err = new Error('Database crash');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
