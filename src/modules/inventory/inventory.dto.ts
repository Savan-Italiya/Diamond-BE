import { z } from 'zod';

export const createLotSchema = z.object({
  lot_number: z.string().min(2).max(50),
  category_id: z.string().uuid().optional(),
  total_carat: z.number().positive(),
  cost_per_carat: z.number().positive(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD')
});

export const createSingleDiamondSchema = z.object({
  lot_id: z.string().uuid().optional(),
  cert_type: z.enum(['GIA', 'IGI', 'HRD', 'NON_CERT']).default('NON_CERT'),
  cert_number: z.string().max(50).optional(),
  shape: z.enum(['ROUND', 'PEAR', 'MARQUISE', 'PRINCESS', 'EMERALD', 'OVAL', 'CUSHION', 'RADIANT', 'HEART']).default('ROUND'),
  carat: z.number().positive(),
  color: z.string().min(1).max(10), // D, E, F...
  clarity: z.string().min(1).max(15), // FL, IF, VVS1, VVS2...
  cut: z.string().max(15).optional(),
  polish: z.string().max(15).optional(),
  symmetry: z.string().max(15).optional(),
  fluorescence: z.string().max(20).optional(),
  lab_video_url: z.string().url().optional()
});

export const lotBreakdownSchema = z.object({
  parent_lot_id: z.string().uuid(),
  new_lot_number: z.string().min(2).max(50),
  carats_transferred: z.number().positive(),
  cost_per_carat: z.number().positive().optional()
});

export const stockAuditSchema = z.object({
  item_type: z.enum(['LOT', 'SINGLE_DIAMOND']),
  item_id: z.string().uuid(),
  physical_carat_found: z.number().nonnegative(),
  remarks: z.string().max(255).optional()
});
