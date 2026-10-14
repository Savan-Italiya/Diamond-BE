"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePartySchema = exports.createPartySchema = void 0;
const zod_1 = require("zod");
exports.createPartySchema = zod_1.z.object({
    business_name: zod_1.z.string().min(2).max(150),
    owner_name: zod_1.z.string().min(2).max(100),
    phone_primary: zod_1.z.string().min(10).max(20),
    phone_secondary: zod_1.z.string().max(20).optional(),
    gstin: zod_1.z.string().max(20).optional(),
    pan: zod_1.z.string().max(15).optional(),
    party_type: zod_1.z.enum(['BUYER', 'SELLER', 'BROKER', 'PROCESSOR']),
    credit_limit: zod_1.z.number().nonnegative().default(0),
    address: zod_1.z
        .object({
        address_line: zod_1.z.string(),
        city: zod_1.z.string().default('Mumbai'),
        state: zod_1.z.string().default('Maharashtra'),
        pincode: zod_1.z.string()
    })
        .optional(),
    bank_details: zod_1.z
        .object({
        bank_name: zod_1.z.string(),
        account_no: zod_1.z.string(),
        ifsc: zod_1.z.string(),
        upi_id: zod_1.z.string().optional()
    })
        .optional(),
    default_commission_rate: zod_1.z.number().min(0).max(100).optional()
});
exports.updatePartySchema = exports.createPartySchema.partial();
//# sourceMappingURL=parties.dto.js.map