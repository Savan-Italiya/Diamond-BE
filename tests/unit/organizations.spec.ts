import { OrganizationsService } from '../../src/modules/organizations/organizations.service';
import { db } from '../../src/database/connection';
import bcrypt from 'bcryptjs';

jest.mock('../../src/database/connection', () => {
  const mockDbFn: any = jest.fn();
  mockDbFn.fn = { now: jest.fn().mockReturnValue('NOW()') };
  mockDbFn.transaction = jest.fn((cb) => cb(mockDbFn));
  return { db: mockDbFn };
});

describe('OrganizationsService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyOrganization', () => {
    it('should return existing organization for user', async () => {
      const mockDb: any = db;
      mockDb.mockImplementation((tableName: string) => {
        if (tableName === 'users') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue({ id: 'u-1', organization_id: 'org-1' }),
              update: jest.fn().mockResolvedValue(1),
              count: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue({ count: 3 }) })
            })
          };
        }
        if (tableName === 'organizations') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue({ id: 'org-1', name: 'BKC Diamonds Pvt Ltd' })
            })
          };
        }
        return { where: jest.fn().mockReturnThis() };
      });

      const org = await OrganizationsService.getMyOrganization('u-1');
      expect(org).toBeDefined();
      expect(org.id).toBe('org-1');
      expect(org.name).toBe('BKC Diamonds Pvt Ltd');
    });
  });

  describe('createOrUpdateOrganization', () => {
    it('should create organization if none exists', async () => {
      const mockDb: any = db;
      mockDb.mockImplementation((tableName: string) => {
        if (tableName === 'organizations') {
          return {
            where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }),
            insert: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([{ id: 'org-new', name: 'Shah & Sons Diamonds' }])
            })
          };
        }
        if (tableName === 'users') {
          return {
            where: jest.fn().mockReturnValue({ update: jest.fn().mockResolvedValue(1) })
          };
        }
        return {};
      });

      const res = await OrganizationsService.createOrUpdateOrganization('u-1', {
        name: 'Shah & Sons Diamonds',
        city: 'Mumbai',
        phone: '+919820099887'
      });

      expect(res.name).toBe('Shah & Sons Diamonds');
    });
  });

  describe('addMember', () => {
    it('should throw 409 if user email or phone already exists', async () => {
      const mockDb: any = db;
      mockDb.mockImplementation(() => ({
        where: jest.fn().mockReturnValue({
          orWhere: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue({ id: 'u-exists' })
          })
        })
      }));

      await expect(
        OrganizationsService.addMember('org-1', {
          name: 'Trader 1',
          phone: '+919999999999',
          email: 'trader1@test.com',
          password: 'Password123',
          role: 'DIAMOND_TRADER',
          user_scope: 'INDIVIDUAL'
        })
      ).rejects.toThrow('User with this email or phone is already registered');
    });
  });
});
