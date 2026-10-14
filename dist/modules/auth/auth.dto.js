"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6)
});
exports.registerUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    phone: zod_1.z.string().min(10).max(20),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    roleNames: zod_1.z.array(zod_1.z.string()).default(['DIAMOND_TRADER'])
});
//# sourceMappingURL=auth.dto.js.map