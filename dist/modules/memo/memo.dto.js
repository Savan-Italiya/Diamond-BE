"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnMemoItemSchema = exports.createMemoBillSchema = void 0;
const zod_1 = require("zod");
exports.createMemoBillSchema = zod_1.z.object({
    memo_number: zod_1.z.string().min(2).max(50),
    party_id: zod_1.z.string().uuid(),
    broker_id: zod_1.z.string().uuid().optional(),
    memo_type: zod_1.z.enum(['MEMO_GIVEN', 'MEMO_RECEIVED']),
    issue_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    return_due_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    items: zod_1.z
        .array(zod_1.z.object({
        lot_id: zod_1.z.string().uuid().optional(),
        single_diamond_id: zod_1.z.string().uuid().optional(),
        carat: zod_1.z.number().positive(),
        asking_price: zod_1.z.number().positive()
    }))
        .min(1)
});
exports.returnMemoItemSchema = zod_1.z.object({
    memo_item_id: zod_1.z.string().uuid(),
    returned_carat: zod_1.z.number().positive(),
    condition_notes: zod_1.z.string().max(255).optional()
});
//# sourceMappingURL=memo.dto.js.map