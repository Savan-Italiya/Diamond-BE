"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initKafkaConsumers = initKafkaConsumers;
const kafka_1 = require("../config/kafka");
const connection_1 = require("../database/connection");
async function initKafkaConsumers() {
    // 1. Process payment due alerts
    await kafka_1.kafkaService.registerConsumer(kafka_1.KafkaTopics.PAYMENT_DUE_ALERT, async (payload) => {
        console.log('📥 [Kafka Event] Payment Due Alert:', payload);
        const { sales_order_id, buyer_id, amount, due_date } = payload;
        const buyer = await (0, connection_1.db)('parties').where({ id: buyer_id }).first();
        if (buyer) {
            // Queue WhatsApp reminder
            await (0, connection_1.db)('notification_queues').insert({
                party_id: buyer_id,
                channel: 'WHATSAPP',
                payload: JSON.stringify({
                    recipient: buyer.phone_primary,
                    business_name: buyer.business_name,
                    amount_due: amount,
                    due_date: due_date,
                    sales_order_id
                }),
                status: 'QUEUED'
            });
        }
    });
    // 2. Process stock status changes
    await kafka_1.kafkaService.registerConsumer(kafka_1.KafkaTopics.STOCK_STATUS_CHANGED, async (payload) => {
        console.log('📥 [Kafka Event] Stock Status Changed:', payload);
    });
    // 3. Process daily reminder triggers
    await kafka_1.kafkaService.registerConsumer(kafka_1.KafkaTopics.DAILY_REMINDER_TRIGGER, async (payload) => {
        console.log('📥 [Kafka Event] Daily Reminder Triggered:', payload);
    });
    // 4. Process WhatsApp dispatch queue
    await kafka_1.kafkaService.registerConsumer(kafka_1.KafkaTopics.WHATSAPP_QUEUE, async (payload) => {
        console.log('📥 [Kafka Event] WhatsApp Dispatch Queue Item:', payload);
        if (payload.queue_id) {
            await (0, connection_1.db)('notification_queues')
                .where({ id: payload.queue_id })
                .update({ status: 'SENT' });
        }
    });
}
//# sourceMappingURL=kafka-consumer.js.map