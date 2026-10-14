"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parties_controller_1 = require("./parties.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const parties_dto_1 = require("./parties.dto");
const audit_middleware_1 = require("../../middleware/audit.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', parties_controller_1.PartiesController.getAll);
router.get('/:id', parties_controller_1.PartiesController.getById);
router.post('/', (0, rbac_middleware_1.requirePermission)('PARTY_MANAGE'), (0, validation_middleware_1.validateRequest)({ body: parties_dto_1.createPartySchema }), (0, audit_middleware_1.auditLogger)('parties'), parties_controller_1.PartiesController.create);
router.patch('/:id', (0, rbac_middleware_1.requirePermission)('PARTY_MANAGE'), (0, validation_middleware_1.validateRequest)({ body: parties_dto_1.updatePartySchema }), (0, audit_middleware_1.auditLogger)('parties'), parties_controller_1.PartiesController.update);
exports.default = router;
//# sourceMappingURL=parties.router.js.map