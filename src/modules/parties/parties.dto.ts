import { z } from 'zod';

export const createPartySchema = z.object({
  business_name: z.string().min(2).max(150),
  owner_name: z.string().min(2).max(100),
  phone_primary: z.string().min(10).max(20),
  phone_secondary: z.string().max(20).optional(),
  gstin: z.string().max(20).optional(),
  pan: z.string().max(15).optional(),
  party_type: z.enum(['BUYER', 'SELLER', 'BROKER', 'PROCESSOR']),
  credit_limit: z.number().nonnegative().default(0),
  address: z
    .object({
      address_line: z.string(),
      city: z.string().default('Mumbai'),
      state: z.string().default('Maharashtra'),
      pincode: z.string()
    })
    .optional(),
  bank_details: z
    .object({
      bank_name: z.string(),
      account_no: z.string(),
      ifsc: z.string(),
      upi_id: z.string().optional()
    })
    .optional(),
  default_commission_rate: z.number().min(0).max(100).optional()
});

export const updatePartySchema = createPartySchema.partial();
