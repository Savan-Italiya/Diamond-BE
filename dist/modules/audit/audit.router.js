"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_service_1 = require("./audit.service");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/logs', (0, rbac_middleware_1.requireRole)(['SUPER_ADMIN']), async (req, res, next) => {
    try {
        const { table_name, record_id, user_id } = req.query;
        const logs = await audit_service_1.AuditService.getLogs({
            table_name: table_name,
            record_id: record_id,
            user_id: user_id
        });
        res.status(200).json({ success: true, count: logs.length, data: logs });
    }
    catch (err) {
        next(err);
    }
});
router.get('/report-schedules', (0, rbac_middleware_1.requireRole)(['SUPER_ADMIN']), async (_req, res, next) => {
    try {
        const schedules = await audit_service_1.AuditService.getReportSchedules();
        res.status(200).json({ success: true, data: schedules });
    }
    catch (err) {
        next(err);
    }
});
router.post('/report-schedules', (0, rbac_middleware_1.requireRole)(['SUPER_ADMIN']), async (req, res, next) => {
    try {
        const schedule = await audit_service_1.AuditService.createReportSchedule(req.body);
        res.status(201).json({ success: true, data: schedule });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=audit.router.js.map