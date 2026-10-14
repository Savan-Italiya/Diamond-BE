import { db } from '../../database/connection';
import { kafkaService, KafkaTopics } from '../../config/kafka';

export class NotificationsService {
  public static async getTemplates() {
    return await db('whatsapp_templates').select('*');
  }

  public static async queueNotification(data: {
    party_id: string;
    channel: 'PUSH' | 'SMS' | 'WHATSAPP';
    payload: Record<string, any>;
  }) {
    const [queueItem] = await db('notification_queues')
      .insert({
        party_id: data.party_id,
        channel: data.channel,
        payload: JSON.stringify(data.payload),
        status: 'QUEUED'
      })
      .returning('*');

    if (data.channel === 'WHATSAPP') {
      await kafkaService.emit(KafkaTopics.WHATSAPP_QUEUE, {
        queue_id: queueItem.id,
        party_id: data.party_id,
        payload: data.payload
      });
    }

    return queueItem;
  }

  public static async generateWhatsAppMessage(
    templateName: string,
    params: Record<string, string>
  ): Promise<string> {
    const template = await db('whatsapp_templates').where({ template_name: templateName }).first();
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
