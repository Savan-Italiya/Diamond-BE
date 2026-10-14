import { z } from 'zod';

export const createRepairSlipSchema = z.object({
  slip_number: z.string().min(2).max(50),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  processor_party_id: z.string().uuid(),
  expected_return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  items: z
    .array(
      z.object({
        lot_id: z.string().uuid().optional(),
        single_diamond_id: z.string().uuid().optional(),
        original_weight: z.number().positive(),
        reason: z.string().min(2).max(255)
      })
    )
    .min(1)
});

export const returnRepairSlipSchema = z.object({
  repair_item_id: z.string().uuid(),
  returned_weight: z.number().positive(),
  processing_charge: z.number().nonnegative().default(0),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
