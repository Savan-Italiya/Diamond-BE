import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(150),
  registration_number: z.string().max(50).optional(),
  phone: z.string().min(10).max(20).optional(),
  email: z.string().email().optional(),
  city: z.string().max(50).default('Mumbai'),
  address: z.string().max(255).optional()
});

export const addMemberSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(20),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['SUPER_ADMIN', 'DIAMOND_TRADER', 'ACCOUNTANT', 'BROKER']).default('DIAMOND_TRADER'),
  user_scope: z.enum(['INDIVIDUAL', 'GLOBAL']).default('INDIVIDUAL') // INDIVIDUAL: own hisab, GLOBAL: all org
});

export const updateMemberStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE'])
});
