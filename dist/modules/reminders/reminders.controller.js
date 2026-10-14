"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersController = void 0;
const reminders_service_1 = require("./reminders.service");
class RemindersController {
    static async getDailyQueue(_req, res, next) {
        try {
            const queue = await reminders_service_1.RemindersService.getDailyFollowUpQueue();
            res.status(200).json({ success: true, count: queue.length, data: queue });
        }
        catch (err) {
            next(err);
        }
    }
    static async logFollowUp(req, res, next) {
        try {
            const log = await reminders_service_1.RemindersService.logFollowUp({
                ...req.body,
                caller_user_id: req.user?.userId
            });
            res.status(201).json({ success: true, message: 'Follow-up call logged', data: log });
        }
        catch (err) {
            next(err);
        }
    }
    static async updatePromisedDate(req, res, next) {
        try {
            const { schedule_id, promised_date } = req.body;
            const updated = await reminders_service_1.RemindersService.updatePromisedDate(schedule_id, promised_date);
            res.status(200).json({ success: true, message: 'Promised date recorded', data: updated });
        }
        catch (err) {
            next(err);
        }
    }
    static async triggerDailyJob(_req, res, next) {
        try {
            const count = await reminders_service_1.RemindersService.runDailyReminderJob();
            res.status(200).json({ success: true, message: `Daily reminders processed (${count} new alerts)` });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.RemindersController = RemindersController;
//# sourceMappingURL=reminders.controller.js.map