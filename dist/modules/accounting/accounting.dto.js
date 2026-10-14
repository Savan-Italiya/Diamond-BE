"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupplierPaymentSchema = exports.createPaymentReceiptSchema = void 0;
const zod_1 = require("zod");
exports.createPaymentReceiptSchema = zod_1.z.object({
    party_id: zod_1.z.string().uuid(),
    amount_received: zod_1.z.number().positive(),
    payment_mode: zod_1.z.enum(['RTGS', 'NEFT', 'CHEQUE', 'CASH', 'UPI', 'ANGDIA']),
    reference_no: zod_1.z.string().max(100).optional(),
    payment_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: zod_1.z.string().max(255).optional(),
    allocations: zod_1.z
        .array(zod_1.z.object({
        sales_order_id: zod_1.z.string().uuid(),
        allocated_amount: zod_1.z.number().positive()
    }))
        .optional()
});
exports.createSupplierPaymentSchema = zod_1.z.object({
    seller_id: zod_1.z.string().uuid(),
    amount_paid: zod_1.z.number().positive(),
    payment_mode: zod_1.z.enum(['RTGS', 'NEFT', 'CHEQUE', 'CASH', 'UPI', 'ANGDIA']),
    reference_no: zod_1.z.string().max(100).optional(),
    payment_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
//# sourceMappingURL=accounting.dto.js.map