import { Producer } from 'kafkajs';
export declare enum KafkaTopics {
    STOCK_STATUS_CHANGED = "diamond.inventory.stock-status-changed",
    PAYMENT_DUE_ALERT = "diamond.accounting.payment-due-alert",
    PAYMENT_RECEIVED = "diamond.accounting.payment-received",
    DAILY_REMINDER_TRIGGER = "diamond.reminders.daily-trigger",
    WHATSAPP_QUEUE = "diamond.notifications.whatsapp-queue"
}
declare class KafkaService {
    private static instance;
    private kafka;
    private producer;
    private consumer;
    private isConnected;
    private constructor();
    static getInstance(): KafkaService;
    getProducer(): Promise<Producer | null>;
    emit(topic: KafkaTopics, payload: Record<string, any>, key?: string): Promise<boolean>;
    registerConsumer(topic: KafkaTopics, handler: (message: Record<string, any>) => Promise<void>): Promise<void>;
    disconnect(): Promise<void>;
}
export declare const kafkaService: KafkaService;
export {};
