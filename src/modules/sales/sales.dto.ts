import { z } from 'zod';

export const createSalesOrderSchema = z.object({
  buyer_id: z.string().uuid(),
  broker_id: z.string().uuid().optional(),
  invoice_number: z.string().min(2).max(50),
  discount_pct: z.number().min(0).max(100).default(0),
  payment_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z
    .array(
      z.object({
        lot_id: z.string().uuid().optional(),
        single_diamond_id: z.string().uuid().optional(),
        carat: z.number().positive(),
        rate_per_carat: z.number().positive()
      })
    )
    .min(1)
});

export const createPurchaseOrderSchema = z.object({
  seller_id: z.string().uuid(),
  broker_id: z.string().uuid().optional(),
  bill_number: z.string().min(2).max(50),
  payment_terms_days: z.number().int().positive().default(30),
  order_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z
    .array(
      z.object({
        lot_id: z.string().uuid().optional(),
        single_diamond_id: z.string().uuid().optional(),
        carat: z.number().positive(),
        rate_per_carat: z.number().positive()
      })
    )
    .min(1)
});
