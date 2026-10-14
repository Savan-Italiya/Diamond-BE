"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersService = void 0;
const connection_1 = require("../../database/connection");
const redis_1 = require("../../config/redis");
const kafka_1 = require("../../config/kafka");
class RemindersService {
    static async getDailyFollowUpQueue() {
        const today = new Date().toISOString().split('T')[0];
        // Check payment schedules due today or overdue
        const overdueSchedules = await (0, connection_1.db)('payment_schedules')
            .join('parties', 'payment_schedules.party_id', 'parties.id')
            .join('sales_orders', 'payment_schedules.sales_order_id', 'sales_orders.id')
            .whereIn('payment_schedules.status', ['PENDING', 'OVERDUE'])
            .where('payment_schedules.due_date', '<=', today)
            .select('payment_schedules.id as schedule_id', 'payment_schedules.due_date', 'payment_schedules.amount_due', 'payment_schedules.status', 'parties.id as party_id', 'parties.business_name', 'parties.owner_name', 'parties.phone_primary', 'sales_orders.invoice_number')
            .orderBy('payment_schedules.due_date', 'asc');
        // Generate WhatsApp deep link and dialing link for each
        return overdueSchedules.map((item) => {
            const cleanPhone = item.phone_primary.replace(/[^0-9]/g, '');
            const message = `Pranam ${item.owner_name} ji (${item.business_name}), gentle reminder regarding invoice #${item.invoice_number} of Rs. ${Number(item.amount_due).toLocaleString('en-IN')} which is due. Kindly arrange payment. Regards, Diamond Bourse Desk.`;
            const encodedMsg = encodeURIComponent(message);
            return {
                ...item,
                one_tap_dial_url: `tel:${item.phone_primary}`,
                whatsapp_app_url: `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`,
                whatsapp_web_url: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
            };
        });
    }
    static async logFollowUp(data) {
        const [log] = await (0, connection_1.db)('follow_up_logs')
            .insert({
            party_id: data.party_id,
            call_date: data.call_date,
            caller_user_id: data.caller_user_id || null,
            client_response: data.client_response,
            next_follow_up_date: data.next_follow_up_date || null,
            audio_note_url: data.audio_note_url || null
        })
            .returning('*');
        return log;
    }
    static async updatePromisedDate(scheduleId, promisedDate) {
        const [updated] = await (0, connection_1.db)('payment_schedules')
            .where({ id: scheduleId })
            .update({
            promised_date: promisedDate,
            status: 'PROMISED'
        })
            .returning('*');
        return updated;
    }
    static async runDailyReminderJob() {
        const queue = await this.getDailyFollowUpQueue();
        const today = new Date().toISOString().split('T')[0];
        let count = 0;
        for (const item of queue) {
            const message = `Follow up needed: ${item.business_name} - Rs. ${Number(item.amount_due).toLocaleString('en-IN')} (Invoice #${item.invoice_number})`;
            // Avoid duplicate reminders for same date & invoice
            const existing = await (0, connection_1.db)('daily_reminders')
                .where({
                scheduled_date: today,
                message: message
            })
                .first();
            if (!existing) {
                await (0, connection_1.db)('daily_reminders').insert({
                    scheduled_date: today,
                    message,
                    is_read: false,
                    pushed_to_kafka: true
                });
                await kafka_1.kafkaService.emit(kafka_1.KafkaTopics.DAILY_REMINDER_TRIGGER, {
                    schedule_id: item.schedule_id,
                    party_id: item.party_id,
                    phone: item.phone_primary,
                    amount_due: item.amount_due,
                    whatsapp_url: item.whatsapp_app_url
                });
                count++;
            }
        }
        // Cache active reminder queue in Redis for mobile instant sync
        await redis_1.redisService.set('diamond:reminders:daily_queue', JSON.stringify(queue), 3600);
        return count;
    }
}
exports.RemindersService = RemindersService;
//# sourceMappingURL=reminders.service.js.map