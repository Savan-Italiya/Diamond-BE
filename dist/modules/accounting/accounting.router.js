"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const accounting_controller_1 = require("./accounting.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const accounting_dto_1 = require("./accounting.dto");
const audit_middleware_1 = require("../../middleware/audit.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/ledger/:party_id', accounting_controller_1.AccountingController.getLedger);
router.post('/receipts', (0, rbac_middleware_1.requirePermission)('PAYMENT_MANAGE'), (0, validation_middleware_1.validateRequest)({ body: accounting_dto_1.createPaymentReceiptSchema }), (0, audit_middleware_1.auditLogger)('payment_receipts'), accounting_controller_1.AccountingController.recordReceipt);
router.post('/supplier-payments', (0, rbac_middleware_1.requirePermission)('PAYMENT_MANAGE'), (0, validation_middleware_1.validateRequest)({ body: accounting_dto_1.createSupplierPaymentSchema }), (0, audit_middleware_1.auditLogger)('supplier_payments'), accounting_controller_1.AccountingController.recordSupplierPayment);
exports.default = router;
//# sourceMappingURL=accounting.router.js.map