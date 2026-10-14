export declare class PaymentReminderCron {
    private static timer;
    static start(intervalMs?: number): void;
    static stop(): void;
    private static executeJob;
}
