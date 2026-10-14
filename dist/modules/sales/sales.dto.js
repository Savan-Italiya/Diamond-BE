"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPurchaseOrderSchema = exports.createSalesOrderSchema = void 0;
const zod_1 = require("zod");
exports.createSalesOrderSchema = zod_1.z.object({
    buyer_id: zod_1.z.string().uuid(),
    broker_id: zod_1.z.string().uuid().optional(),
    invoice_number: zod_1.z.string().min(2).max(50),
    discount_pct: zod_1.z.number().min(0).max(100).default(0),
    payment_due_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    items: zod_1.z
        .array(zod_1.z.object({
        lot_id: zod_1.z.string().uuid().optional(),
        single_diamond_id: zod_1.z.string().uuid().optional(),
        carat: zod_1.z.number().positive(),
        rate_per_carat: zod_1.z.number().positive()
    }))
        .min(1)
});
exports.createPurchaseOrderSchema = zod_1.z.object({
    seller_id: zod_1.z.string().uuid(),
    broker_id: zod_1.z.string().uuid().optional(),
    bill_number: zod_1.z.string().min(2).max(50),
    payment_terms_days: zod_1.z.number().int().positive().default(30),
    order_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    items: zod_1.z
        .array(zod_1.z.object({
        lot_id: zod_1.z.string().uuid().optional(),
        single_diamond_id: zod_1.z.string().uuid().optional(),
        carat: zod_1.z.number().positive(),
        rate_per_carat: zod_1.z.number().positive()
    }))
        .min(1)
});
//# sourceMappingURL=sales.dto.js.map