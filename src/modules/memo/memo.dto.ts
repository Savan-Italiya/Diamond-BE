import { z } from 'zod';

export const createMemoBillSchema = z.object({
  memo_number: z.string().min(2).max(50),
  party_id: z.string().uuid(),
  broker_id: z.string().uuid().optional(),
  memo_type: z.enum(['MEMO_GIVEN', 'MEMO_RECEIVED']),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  return_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z
    .array(
      z.object({
        lot_id: z.string().uuid().optional(),
        single_diamond_id: z.string().uuid().optional(),
        carat: z.number().positive(),
        asking_price: z.number().positive()
      })
    )
    .min(1)
});

export const returnMemoItemSchema = z.object({
  memo_item_id: z.string().uuid(),
  returned_carat: z.number().positive(),
  condition_notes: z.string().max(255).optional()
});
