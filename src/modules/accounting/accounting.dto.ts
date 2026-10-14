import { z } from 'zod';

export const createPaymentReceiptSchema = z.object({
  party_id: z.string().uuid(),
  amount_received: z.number().positive(),
  payment_mode: z.enum(['RTGS', 'NEFT', 'CHEQUE', 'CASH', 'UPI', 'ANGDIA']),
  reference_no: z.string().max(100).optional(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(255).optional(),
  allocations: z
    .array(
      z.object({
        sales_order_id: z.string().uuid(),
        allocated_amount: z.number().positive()
      })
    )
    .optional()
});

export const createSupplierPaymentSchema = z.object({
  seller_id: z.string().uuid(),
  amount_paid: z.number().positive(),
  payment_mode: z.enum(['RTGS', 'NEFT', 'CHEQUE', 'CASH', 'UPI', 'ANGDIA']),
  reference_no: z.string().max(100).optional(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
