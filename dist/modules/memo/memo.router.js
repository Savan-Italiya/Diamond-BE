"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const memo_controller_1 = require("./memo.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const memo_dto_1 = require("./memo.dto");
const audit_middleware_1 = require("../../middleware/audit.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', memo_controller_1.MemoController.getAll);
router.get('/:id', memo_controller_1.MemoController.getById);
router.post('/', (0, rbac_middleware_1.requirePermission)('MEMO_ISSUE'), (0, validation_middleware_1.validateRequest)({ body: memo_dto_1.createMemoBillSchema }), (0, audit_middleware_1.auditLogger)('memo_bills'), memo_controller_1.MemoController.create);
router.post('/return', (0, rbac_middleware_1.requirePermission)('MEMO_RETURN'), (0, validation_middleware_1.validateRequest)({ body: memo_dto_1.returnMemoItemSchema }), (0, audit_middleware_1.auditLogger)('memo_return_logs'), memo_controller_1.MemoController.returnItem);
exports.default = router;
//# sourceMappingURL=memo.router.js.map