"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentReminderCron = void 0;
const reminders_service_1 = require("../modules/reminders/reminders.service");
class PaymentReminderCron {
    static timer = null;
    static start(intervalMs = 3600000) {
        console.log('⏰ Payment Reminder Cron initialized (interval:', intervalMs, 'ms)');
        // Run once on startup (deferred)
        setTimeout(() => {
            this.executeJob();
        }, 5000);
        this.timer = setInterval(() => {
            this.executeJob();
        }, intervalMs);
    }
    static stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    static async executeJob() {
        try {
            const count = await reminders_service_1.RemindersService.runDailyReminderJob();
            if (count > 0) {
                console.log(`⏰ [Reminder Cron] Successfully queued ${count} daily follow-up reminders.`);
            }
        }
        catch (err) {
            console.warn('⚠️ [Reminder Cron] Error running daily reminder cycle:', err.message);
        }
    }
}
exports.PaymentReminderCron = PaymentReminderCron;
//# sourceMappingURL=payment-reminder.cron.js.map