"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const processing_controller_1 = require("./processing.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const processing_dto_1 = require("./processing.dto");
const audit_middleware_1 = require("../../middleware/audit.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', processing_controller_1.ProcessingController.getAll);
router.post('/', (0, rbac_middleware_1.requirePermission)('KARKHANA_MANAGE'), (0, validation_middleware_1.validateRequest)({ body: processing_dto_1.createRepairSlipSchema }), (0, audit_middleware_1.auditLogger)('repair_issue_slips'), processing_controller_1.ProcessingController.create);
router.post('/return', (0, rbac_middleware_1.requirePermission)('KARKHANA_MANAGE'), (0, validation_middleware_1.validateRequest)({ body: processing_dto_1.returnRepairSlipSchema }), (0, audit_middleware_1.auditLogger)('repair_return_slips'), processing_controller_1.ProcessingController.returnItem);
exports.default = router;
//# sourceMappingURL=processing.router.js.map