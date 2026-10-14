import bcrypt from 'bcryptjs';
import { AuthService } from '../../src/modules/auth/auth.service';
import { db } from '../../src/database/connection';
import { AppError } from '../../src/middleware/error.middleware';

jest.mock('../../src/database/connection');

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully log in with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Secret123', 10);
      const mockUser = {
        id: 'u-123',
        name: 'Suresh Shah',
        email: 'suresh@bkc.com',
        phone: '+919820000000',
        password_hash: hashedPassword,
        status: 'ACTIVE'
      };

      const mockDb: any = db;
      mockDb.mockImplementation((tableName: string) => {
        if (tableName === 'users') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(mockUser)
            })
          };
        }
        if (tableName === 'user_roles') {
          return {
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue([{ role_name: 'DIAMOND_TRADER' }])
            })
          };
        }
        if (tableName === 'role_permissions') {
          return {
            join: jest.fn().mockReturnThis(),
            whereIn: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue([{ permission_code: 'INVENTORY_VIEW' }])
            })
          };
        }
        return {};
      });

      const result = await AuthService.login('suresh@bkc.com', 'Secret123');
      expect(result).toHaveProperty('token');
      expect(result.user.name).toBe('Suresh Shah');
      expect(result.user.roles).toContain('DIAMOND_TRADER');
    });

    it('should throw 401 if user does not exist', async () => {
      const mockDb: any = db;
      mockDb.mockImplementation(() => ({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null)
        })
      }));

      await expect(AuthService.login('unknown@bkc.com', 'pwd')).rejects.toThrow(AppError);
    });

    it('should throw 401 if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword', 10);
      const mockDb: any = db;
      mockDb.mockImplementation(() => ({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({
            id: '1',
            password_hash: hashedPassword,
            status: 'ACTIVE'
          })
        })
      }));

      await expect(AuthService.login('user@bkc.com', 'WrongPassword')).rejects.toThrow(AppError);
    });
  });

  describe('register', () => {
    it('should throw 409 if user email or phone already exists', async () => {
      const mockDb: any = db;
      mockDb.mockImplementation(() => ({
        where: jest.fn().mockReturnValue({
          orWhere: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue({ id: 'exists' })
          })
        })
      }));

      await expect(
        AuthService.register({
          name: 'Pravin',
          phone: '+919820111111',
          email: 'exists@bkc.com',
          password: 'Password123',
          roleNames: ['DIAMOND_TRADER']
        })
      ).rejects.toThrow(AppError);
    });
  });
});
