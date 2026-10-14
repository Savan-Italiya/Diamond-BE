"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reminders_controller_1 = require("./reminders.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const reminders_dto_1 = require("./reminders.dto");
const audit_middleware_1 = require("../../middleware/audit.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/daily-queue', reminders_controller_1.RemindersController.getDailyQueue);
router.post('/follow-up', (0, rbac_middleware_1.requirePermission)('FOLLOWUP_DIAL'), (0, validation_middleware_1.validateRequest)({ body: reminders_dto_1.logFollowUpSchema }), (0, audit_middleware_1.auditLogger)('follow_up_logs'), reminders_controller_1.RemindersController.logFollowUp);
router.post('/promise-date', (0, rbac_middleware_1.requirePermission)('FOLLOWUP_DIAL'), (0, validation_middleware_1.validateRequest)({ body: reminders_dto_1.updateSchedulePromiseSchema }), (0, audit_middleware_1.auditLogger)('payment_schedules'), reminders_controller_1.RemindersController.updatePromisedDate);
router.post('/run-job', (0, rbac_middleware_1.requirePermission)('SUPER_ADMIN'), reminders_controller_1.RemindersController.triggerDailyJob);
exports.default = router;
//# sourceMappingURL=reminders.router.js.map