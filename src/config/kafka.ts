import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';
import { config } from './env';

export enum KafkaTopics {
  STOCK_STATUS_CHANGED = 'diamond.inventory.stock-status-changed',
  PAYMENT_DUE_ALERT = 'diamond.accounting.payment-due-alert',
  PAYMENT_RECEIVED = 'diamond.accounting.payment-received',
  DAILY_REMINDER_TRIGGER = 'diamond.reminders.daily-trigger',
  WHATSAPP_QUEUE = 'diamond.notifications.whatsapp-queue'
}

class KafkaService {
  private static instance: KafkaService;
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  private isConnected = false;

  private constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      logLevel: logLevel.NOTHING,
      retry: {
        initialRetryTime: 300,
        retries: 2
      }
    });
  }

  public static getInstance(): KafkaService {
    if (!KafkaService.instance) {
      KafkaService.instance = new KafkaService();
    }
    return KafkaService.instance;
  }

  public async getProducer(): Promise<Producer | null> {
    if (this.producer) return this.producer;
    try {
      this.producer = this.kafka.producer();
      await this.producer.connect();
      this.isConnected = true;
      console.log('✅ Connected to Kafka Producer');
      return this.producer;
    } catch (err: any) {
      // In dev/test when Kafka is offline, gracefully fallback
      if (config.env !== 'test') {
        console.warn('⚠️ Kafka Producer connection skipped:', err.message);
      }
      return null;
    }
  }

  public async emit(topic: KafkaTopics, payload: Record<string, any>, key?: string): Promise<boolean> {
    try {
      const prod = await this.getProducer();
      if (!prod) {
        if (config.env === 'development') {
          console.log(`[Kafka Dev Fallback] Emitted to topic "${topic}":`, JSON.stringify(payload));
        }
        return true;
      }

      await prod.send({
        topic,
        messages: [
          {
            key: key || new Date().toISOString(),
            value: JSON.stringify(payload)
          }
        ]
      });
      return true;
    } catch (err) {
      console.error(`Failed to publish message to topic ${topic}:`, err);
      return false;
    }
  }

  public async registerConsumer(
    topic: KafkaTopics,
    handler: (message: Record<string, any>) => Promise<void>
  ): Promise<void> {
    try {
      if (!this.consumer) {
        this.consumer = this.kafka.consumer({ groupId: config.kafka.groupId });
        await this.consumer.connect();
      }

      await this.consumer.subscribe({ topic, fromBeginning: false });
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          if (message.value) {
            try {
              const data = JSON.parse(message.value.toString());
              await handler(data);
            } catch (e) {
              console.error('Error handling Kafka message:', e);
            }
          }
        }
      });
    } catch (err: any) {
      if (config.env !== 'test') {
        console.warn(`Kafka Consumer registration skipped for topic ${topic}:`, err.message);
      }
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.producer) await this.producer.disconnect();
      if (this.consumer) await this.consumer.disconnect();
    } catch {
      // ignore
    }
  }
}

export const kafkaService = KafkaService.getInstance();
