import { kafkaService, KafkaTopics } from '../config/kafka';
import { db } from '../database/connection';

export async function initKafkaConsumers(): Promise<void> {
  // 1. Process payment due alerts
  await kafkaService.registerConsumer(KafkaTopics.PAYMENT_DUE_ALERT, async (payload) => {
    console.log('📥 [Kafka Event] Payment Due Alert:', payload);
    const { sales_order_id, buyer_id, amount, due_date } = payload;

    const buyer = await db('parties').where({ id: buyer_id }).first();
    if (buyer) {
      // Queue WhatsApp reminder
      await db('notification_queues').insert({
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
  await kafkaService.registerConsumer(KafkaTopics.STOCK_STATUS_CHANGED, async (payload) => {
    console.log('📥 [Kafka Event] Stock Status Changed:', payload);
  });

  // 3. Process daily reminder triggers
  await kafkaService.registerConsumer(KafkaTopics.DAILY_REMINDER_TRIGGER, async (payload) => {
    console.log('📥 [Kafka Event] Daily Reminder Triggered:', payload);
  });

  // 4. Process WhatsApp dispatch queue
  await kafkaService.registerConsumer(KafkaTopics.WHATSAPP_QUEUE, async (payload) => {
    console.log('📥 [Kafka Event] WhatsApp Dispatch Queue Item:', payload);
    if (payload.queue_id) {
      await db('notification_queues')
        .where({ id: payload.queue_id })
        .update({ status: 'SENT' });
    }
  });
}
