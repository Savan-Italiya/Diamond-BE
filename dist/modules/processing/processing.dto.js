"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnRepairSlipSchema = exports.createRepairSlipSchema = void 0;
const zod_1 = require("zod");
exports.createRepairSlipSchema = zod_1.z.object({
    slip_number: zod_1.z.string().min(2).max(50),
    issue_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    processor_party_id: zod_1.z.string().uuid(),
    expected_return_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    items: zod_1.z
        .array(zod_1.z.object({
        lot_id: zod_1.z.string().uuid().optional(),
        single_diamond_id: zod_1.z.string().uuid().optional(),
        original_weight: zod_1.z.number().positive(),
        reason: zod_1.z.string().min(2).max(255)
    }))
        .min(1)
});
exports.returnRepairSlipSchema = zod_1.z.object({
    repair_item_id: zod_1.z.string().uuid(),
    returned_weight: zod_1.z.number().positive(),
    processing_charge: zod_1.z.number().nonnegative().default(0),
    return_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
//# sourceMappingURL=processing.dto.js.map