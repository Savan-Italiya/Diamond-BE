"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kafkaService = exports.KafkaTopics = void 0;
const kafkajs_1 = require("kafkajs");
const env_1 = require("./env");
var KafkaTopics;
(function (KafkaTopics) {
    KafkaTopics["STOCK_STATUS_CHANGED"] = "diamond.inventory.stock-status-changed";
    KafkaTopics["PAYMENT_DUE_ALERT"] = "diamond.accounting.payment-due-alert";
    KafkaTopics["PAYMENT_RECEIVED"] = "diamond.accounting.payment-received";
    KafkaTopics["DAILY_REMINDER_TRIGGER"] = "diamond.reminders.daily-trigger";
    KafkaTopics["WHATSAPP_QUEUE"] = "diamond.notifications.whatsapp-queue";
})(KafkaTopics || (exports.KafkaTopics = KafkaTopics = {}));
class KafkaService {
    static instance;
    kafka;
    producer = null;
    consumer = null;
    isConnected = false;
    constructor() {
        this.kafka = new kafkajs_1.Kafka({
            clientId: env_1.config.kafka.clientId,
            brokers: env_1.config.kafka.brokers,
            logLevel: kafkajs_1.logLevel.NOTHING,
            retry: {
                initialRetryTime: 300,
                retries: 2
            }
        });
    }
    static getInstance() {
        if (!KafkaService.instance) {
            KafkaService.instance = new KafkaService();
        }
        return KafkaService.instance;
    }
    async getProducer() {
        if (this.producer)
            return this.producer;
        try {
            this.producer = this.kafka.producer();
            await this.producer.connect();
            this.isConnected = true;
            console.log('✅ Connected to Kafka Producer');
            return this.producer;
        }
        catch (err) {
            // In dev/test when Kafka is offline, gracefully fallback
            if (env_1.config.env !== 'test') {
                console.warn('⚠️ Kafka Producer connection skipped:', err.message);
            }
            return null;
        }
    }
    async emit(topic, payload, key) {
        try {
            const prod = await this.getProducer();
            if (!prod) {
                if (env_1.config.env === 'development') {
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
        }
        catch (err) {
            console.error(`Failed to publish message to topic ${topic}:`, err);
            return false;
        }
    }
    async registerConsumer(topic, handler) {
        try {
            if (!this.consumer) {
                this.consumer = this.kafka.consumer({ groupId: env_1.config.kafka.groupId });
                await this.consumer.connect();
            }
            await this.consumer.subscribe({ topic, fromBeginning: false });
            await this.consumer.run({
                eachMessage: async ({ message }) => {
                    if (message.value) {
                        try {
                            const data = JSON.parse(message.value.toString());
                            await handler(data);
                        }
                        catch (e) {
                            console.error('Error handling Kafka message:', e);
                        }
                    }
                }
            });
        }
        catch (err) {
            if (env_1.config.env !== 'test') {
                console.warn(`Kafka Consumer registration skipped for topic ${topic}:`, err.message);
            }
        }
    }
    async disconnect() {
        try {
            if (this.producer)
                await this.producer.disconnect();
            if (this.consumer)
                await this.consumer.disconnect();
        }
        catch {
            // ignore
        }
    }
}
exports.kafkaService = KafkaService.getInstance();
//# sourceMappingURL=kafka.js.map