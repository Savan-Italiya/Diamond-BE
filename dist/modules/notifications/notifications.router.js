"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_service_1 = require("./notifications.service");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/templates', async (_req, res, next) => {
    try {
        const templates = await notifications_service_1.NotificationsService.getTemplates();
        res.status(200).json({ success: true, data: templates });
    }
    catch (err) {
        next(err);
    }
});
router.post('/queue', async (req, res, next) => {
    try {
        const queued = await notifications_service_1.NotificationsService.queueNotification(req.body);
        res.status(201).json({ success: true, data: queued });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=notifications.router.js.map