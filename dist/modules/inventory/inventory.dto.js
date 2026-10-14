"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockAuditSchema = exports.lotBreakdownSchema = exports.createSingleDiamondSchema = exports.createLotSchema = void 0;
const zod_1 = require("zod");
exports.createLotSchema = zod_1.z.object({
    lot_number: zod_1.z.string().min(2).max(50),
    category_id: zod_1.z.string().uuid().optional(),
    total_carat: zod_1.z.number().positive(),
    cost_per_carat: zod_1.z.number().positive(),
    purchase_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD')
});
exports.createSingleDiamondSchema = zod_1.z.object({
    lot_id: zod_1.z.string().uuid().optional(),
    cert_type: zod_1.z.enum(['GIA', 'IGI', 'HRD', 'NON_CERT']).default('NON_CERT'),
    cert_number: zod_1.z.string().max(50).optional(),
    shape: zod_1.z.enum(['ROUND', 'PEAR', 'MARQUISE', 'PRINCESS', 'EMERALD', 'OVAL', 'CUSHION', 'RADIANT', 'HEART']).default('ROUND'),
    carat: zod_1.z.number().positive(),
    color: zod_1.z.string().min(1).max(10), // D, E, F...
    clarity: zod_1.z.string().min(1).max(15), // FL, IF, VVS1, VVS2...
    cut: zod_1.z.string().max(15).optional(),
    polish: zod_1.z.string().max(15).optional(),
    symmetry: zod_1.z.string().max(15).optional(),
    fluorescence: zod_1.z.string().max(20).optional(),
    lab_video_url: zod_1.z.string().url().optional()
});
exports.lotBreakdownSchema = zod_1.z.object({
    parent_lot_id: zod_1.z.string().uuid(),
    new_lot_number: zod_1.z.string().min(2).max(50),
    carats_transferred: zod_1.z.number().positive(),
    cost_per_carat: zod_1.z.number().positive().optional()
});
exports.stockAuditSchema = zod_1.z.object({
    item_type: zod_1.z.enum(['LOT', 'SINGLE_DIAMOND']),
    item_id: zod_1.z.string().uuid(),
    physical_carat_found: zod_1.z.number().nonnegative(),
    remarks: zod_1.z.string().max(255).optional()
});
//# sourceMappingURL=inventory.dto.js.map