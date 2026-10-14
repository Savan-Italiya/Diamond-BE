import { RemindersService } from '../modules/reminders/reminders.service';

export class PaymentReminderCron {
  private static timer: NodeJS.Timeout | null = null;

  public static start(intervalMs: number = 3600000): void {
    console.log('⏰ Payment Reminder Cron initialized (interval:', intervalMs, 'ms)');

    // Run once on startup (deferred)
    setTimeout(() => {
      this.executeJob();
    }, 5000);

    this.timer = setInterval(() => {
      this.executeJob();
    }, intervalMs);
  }

  public static stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private static async executeJob(): Promise<void> {
    try {
      const count = await RemindersService.runDailyReminderJob();
      if (count > 0) {
        console.log(`⏰ [Reminder Cron] Successfully queued ${count} daily follow-up reminders.`);
      }
    } catch (err: any) {
      console.warn('⚠️ [Reminder Cron] Error running daily reminder cycle:', err.message);
    }
  }
}
