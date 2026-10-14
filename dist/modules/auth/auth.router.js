"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_dto_1 = require("./auth.dto");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const router = (0, express_1.Router)();
router.post('/login', (0, validation_middleware_1.validateRequest)({ body: auth_dto_1.loginSchema }), auth_controller_1.AuthController.login);
router.post('/register', auth_middleware_1.authenticate, (0, rbac_middleware_1.requireRole)(['SUPER_ADMIN']), (0, validation_middleware_1.validateRequest)({ body: auth_dto_1.registerUserSchema }), auth_controller_1.AuthController.register);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.AuthController.me);
exports.default = router;
//# sourceMappingURL=auth.router.js.map