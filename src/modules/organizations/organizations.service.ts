import bcrypt from 'bcryptjs';
import { db } from '../../database/connection';
import { AppError } from '../../middleware/error.middleware';

export class OrganizationsService {
  public static async getMyOrganization(userId: string) {
    const user = await db('users').where({ id: userId }).first();
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    let org = null;
    if (user.organization_id) {
      org = await db('organizations').where({ id: user.organization_id }).first();
    } else {
      // Find if user owns an organization
      org = await db('organizations').where({ owner_user_id: userId }).first();
      if (org && !user.organization_id) {
        await db('users').where({ id: userId }).update({ organization_id: org.id });
      }
    }

    if (!org) {
      // Default auto-created firm for primary admin if none exists
      const [newOrg] = await db('organizations')
        .insert({
          name: 'BKC Diamond Bourse Trading Firm',
          registration_number: 'BDB-TWR-G-402',
          phone: user.phone || '+919820011223',
          email: user.email || 'admin@bkc-diamonds.com',
          city: 'Mumbai',
          address: 'G-Block, Bandra Kurla Complex, Mumbai, Maharashtra 400051',
          owner_user_id: userId
        })
        .returning('*');

      await db('users').where({ id: userId }).update({ organization_id: newOrg.id, user_scope: 'GLOBAL' });
      org = newOrg;
    }

    const membersCount = await db('users')
      .where({ organization_id: org.id })
      .count('id as count')
      .first();

    return {
      ...org,
      members_count: Number(membersCount?.count || 1)
    };
  }

  public static async createOrUpdateOrganization(userId: string, data: {
    name: string;
    registration_number?: string;
    phone?: string;
    email?: string;
    city?: string;
    address?: string;
  }) {
    const existingOrg = await db('organizations').where({ owner_user_id: userId }).first();

    if (existingOrg) {
      const [updated] = await db('organizations')
        .where({ id: existingOrg.id })
        .update({
          name: data.name,
          registration_number: data.registration_number || existingOrg.registration_number,
          phone: data.phone || existingOrg.phone,
          email: data.email || existingOrg.email,
          city: data.city || existingOrg.city,
          address: data.address || existingOrg.address,
          updated_at: db.fn.now()
        })
        .returning('*');
      return updated;
    }

    const [created] = await db('organizations')
      .insert({
        ...data,
        owner_user_id: userId
      })
      .returning('*');

    await db('users').where({ id: userId }).update({ organization_id: created.id, user_scope: 'GLOBAL' });
    return created;
  }

  public static async getMembers(orgId: string) {
    const users = await db('users')
      .where({ organization_id: orgId })
      .select('id', 'name', 'phone', 'email', 'status', 'user_scope', 'created_at');

    const result = [];
    for (const u of users) {
      const userRoles = await db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .where('user_roles.user_id', u.id)
        .pluck('roles.role_name');

      // Count user's individual sales
      const salesCount = await db('sales_orders')
        .where({ created_by_user_id: u.id })
        .count('id as count')
        .first();

      result.push({
        ...u,
        roles: userRoles.length > 0 ? userRoles : ['DIAMOND_TRADER'],
        my_deals_count: Number(salesCount?.count || 0)
      });
    }

    return result;
  }

  public static async addMember(orgId: string, memberData: {
    name: string;
    phone: string;
    email: string;
    password: string;
    role: string;
    user_scope: string;
  }) {
    // Check if phone or email already registered
    const existing = await db('users')
      .where({ email: memberData.email })
      .orWhere({ phone: memberData.phone })
      .first();

    if (existing) {
      throw new AppError('User with this email or phone is already registered', 409, 'ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(memberData.password, 10);

    return await db.transaction(async (trx) => {
      const [newUser] = await trx('users')
        .insert({
          name: memberData.name,
          phone: memberData.phone,
          email: memberData.email,
          password_hash: passwordHash,
          status: 'ACTIVE',
          organization_id: orgId,
          user_scope: memberData.user_scope || 'INDIVIDUAL'
        })
        .returning(['id', 'name', 'phone', 'email', 'status', 'organization_id', 'user_scope', 'created_at']);

      let role = await trx('roles').where({ role_name: memberData.role }).first();
      if (!role) {
        const [createdRole] = await trx('roles')
          .insert({ role_name: memberData.role, description: `Role for ${memberData.role}` })
          .returning('*');
        role = createdRole;
      }

      await trx('user_roles').insert({
        user_id: newUser.id,
        role_id: role.id
      });

      return {
        ...newUser,
        roles: [memberData.role]
      };
    });
  }

  public static async updateMemberStatus(orgId: string, targetUserId: string, status: string) {
    const user = await db('users')
      .where({ id: targetUserId, organization_id: orgId })
      .first();

    if (!user) throw new AppError('Member not found in organization', 404, 'NOT_FOUND');

    const [updated] = await db('users')
      .where({ id: targetUserId })
      .update({ status, updated_at: db.fn.now() })
      .returning(['id', 'name', 'phone', 'email', 'status', 'user_scope']);

    return updated;
  }
}
