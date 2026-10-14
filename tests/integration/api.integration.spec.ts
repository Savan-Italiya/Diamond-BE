import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { config } from '../../src/config/env';
import { db } from '../../src/database/connection';

jest.mock('../../src/database/connection');
jest.mock('../../src/config/redis', () => ({
  redisService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1)
  }
}));

describe('API Integration Test Suite', () => {
  let validToken: string;

  beforeAll(() => {
    validToken = jwt.sign(
      {
        userId: 'admin-1',
        name: 'Admin Test',
        email: 'admin@bkc.com',
        roles: ['SUPER_ADMIN'],
        permissions: ['INVENTORY_VIEW', 'INVENTORY_MANAGE', 'PARTY_MANAGE', 'MEMO_ISSUE']
      },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /health', () => {
    it('should return UP status and service name', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.service).toContain('Diamond Trading ERP');
    });
  });

  describe('Route 404', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const res = await request(app).get('/api/v1/unknown-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 400 validation error if body is empty', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Protected Routes without Token', () => {
    it('should return 401 when fetching parties without Bearer token', async () => {
      const res = await request(app).get('/api/v1/parties');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when fetching inventory lots without token', async () => {
      const res = await request(app).get('/api/v1/inventory/lots');
      expect(res.status).toBe(401);
    });
  });

  describe('Protected Routes with Valid Token', () => {
    it('should access /api/v1/auth/me with valid JWT', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('admin@bkc.com');
    });

    it('should fetch parties with valid token', async () => {
      const mockParties = [{ id: 'p-1', business_name: 'BKC Solitaires' }];
      const mockDb: any = db;
      mockDb.mockImplementation((table: string) => {
        if (table === 'parties') {
          return {
            select: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnThis(),
              whereILike: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockResolvedValue(mockParties)
            })
          };
        }
        if (table === 'party_ledgers') {
          return {
            whereIn: jest.fn().mockReturnThis(),
            distinctOn: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue([{ party_id: 'p-1', running_balance: 0 }])
          };
        }
        return {};
      });

      const res = await request(app)
        .get('/api/v1/parties')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].business_name).toBe('BKC Solitaires');
    });
  });
});
