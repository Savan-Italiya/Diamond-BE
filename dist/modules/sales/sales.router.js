"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sales_controller_1 = require("./sales.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const sales_dto_1 = require("./sales.dto");
const audit_middleware_1 = require("../../middleware/audit.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', sales_controller_1.SalesController.getAll);
router.get('/debtors-ageing', sales_controller_1.SalesController.getDebtorsAgeing);
router.post('/', (0, rbac_middleware_1.requirePermission)('SALES_CREATE'), (0, validation_middleware_1.validateRequest)({ body: sales_dto_1.createSalesOrderSchema }), (0, audit_middleware_1.auditLogger)('sales_orders'), sales_controller_1.SalesController.create);
exports.default = router;
//# sourceMappingURL=sales.router.js.map