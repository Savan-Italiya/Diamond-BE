import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../database/connection';
import { config } from '../../config/env';
import { AppError } from '../../middleware/error.middleware';
import { UserPayload } from '../../types';

export class AuthService {
  public static async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const user = await db('users').where({ email }).first();
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Invalid credentials or inactive account', 401, 'INVALID_CREDENTIALS');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials or inactive account', 401, 'INVALID_CREDENTIALS');
    }

    // Fetch roles and permissions
    const roles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', user.id)
      .select('roles.role_name');

    const roleNames = roles.map((r) => r.role_name);

    const permissions = await db('role_permissions')
      .join('roles', 'role_permissions.role_id', 'roles.id')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .whereIn('roles.role_name', roleNames)
      .select('permissions.permission_code');

    const permissionCodes = Array.from(new Set(permissions.map((p) => p.permission_code)));

    const payload: UserPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      roles: roleNames,
      permissions: permissionCodes,
      organization_id: user.organization_id || null,
      user_scope: user.user_scope || 'INDIVIDUAL'
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any
    });

    const { password_hash, ...safeUser } = user;
    return {
      token,
      user: {
        ...safeUser,
        roles: roleNames,
        permissions: permissionCodes
      }
    };
  }

  public static async register(data: {
    name: string;
    phone: string;
    email: string;
    password: string;
    roleNames: string[];
  }): Promise<any> {
    const existing = await db('users')
      .where('email', data.email)
      .orWhere('phone', data.phone)
      .first();

    if (existing) {
      throw new AppError('User with email or phone already exists', 409, 'USER_EXISTS');
    }

    const password_hash = await bcrypt.hash(data.password, 10);

    const [newUser] = await db('users')
      .insert({
        name: data.name,
        phone: data.phone,
        email: data.email,
        password_hash,
        status: 'ACTIVE'
      })
      .returning(['id', 'name', 'phone', 'email', 'status', 'created_at']);

    // Assign roles
    if (data.roleNames && data.roleNames.length > 0) {
      const roles = await db('roles').whereIn('role_name', data.roleNames);
      for (const role of roles) {
        await db('user_roles').insert({
          user_id: newUser.id,
          role_id: role.id
        });
      }
    }

    return newUser;
  }
}
