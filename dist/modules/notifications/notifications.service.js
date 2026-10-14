"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const connection_1 = require("../../database/connection");
const kafka_1 = require("../../config/kafka");
class NotificationsService {
    static async getTemplates() {
        return await (0, connection_1.db)('whatsapp_templates').select('*');
    }
    static async queueNotification(data) {
        const [queueItem] = await (0, connection_1.db)('notification_queues')
            .insert({
            party_id: data.party_id,
            channel: data.channel,
            payload: JSON.stringify(data.payload),
            status: 'QUEUED'
        })
            .returning('*');
        if (data.channel === 'WHATSAPP') {
            await kafka_1.kafkaService.emit(kafka_1.KafkaTopics.WHATSAPP_QUEUE, {
                queue_id: queueItem.id,
                party_id: data.party_id,
                payload: data.payload
            });
        }
        return queueItem;
    }
    static async generateWhatsAppMessage(templateName, params) {
        const template = await (0, connection_1.db)('whatsapp_templates').where({ template_name: templateName }).first();
        if (!template) {
            return `Dear Customer, update from Diamond ERP.`;
        }
        let body = template.message_body;
        for (const [key, value] of Object.entries(params)) {
            body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        return body;
    }
}
exports.NotificationsService = NotificationsService;
//# sourceMappingURL=notifications.service.js.map