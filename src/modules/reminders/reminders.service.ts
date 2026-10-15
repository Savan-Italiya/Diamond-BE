import { db } from '../../database/connection';
import { redisService } from '../../config/redis';
import { kafkaService, KafkaTopics } from '../../config/kafka';
import { NotificationsService } from '../notifications/notifications.service';

export class RemindersService {
  public static async getDailyFollowUpQueue() {
    const today = new Date().toISOString().split('T')[0];

    // Check payment schedules due today or overdue
    const overdueSchedules = await db('payment_schedules')
      .join('parties', 'payment_schedules.party_id', 'parties.id')
      .join('sales_orders', 'payment_schedules.sales_order_id', 'sales_orders.id')
      .whereIn('payment_schedules.status', ['PENDING', 'OVERDUE'])
      .where('payment_schedules.due_date', '<=', today)
      .select(
        'payment_schedules.id as schedule_id',
        'payment_schedules.due_date',
        'payment_schedules.amount_due',
        'payment_schedules.status',
        'parties.id as party_id',
        'parties.business_name',
        'parties.owner_name',
        'parties.phone_primary',
        'sales_orders.invoice_number'
      )
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

  public static async logFollowUp(data: {
    party_id: string;
    call_date: string;
    caller_user_id?: string;
    client_response: string;
    next_follow_up_date?: string;
    audio_note_url?: string;
  }) {
    const [log] = await db('follow_up_logs')
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

  public static async updatePromisedDate(scheduleId: string, promisedDate: string) {
    const [updated] = await db('payment_schedules')
      .where({ id: scheduleId })
      .update({
        promised_date: promisedDate,
        status: 'PROMISED'
      })
      .returning('*');

    return updated;
  }

  public static async runDailyReminderJob(): Promise<number> {
    const queue = await this.getDailyFollowUpQueue();
    const today = new Date().toISOString().split('T')[0];

    let count = 0;
    for (const item of queue) {
      const message = `Follow up needed: ${item.business_name} - Rs. ${Number(item.amount_due).toLocaleString('en-IN')} (Invoice #${item.invoice_number})`;

      // Avoid duplicate reminders for same date & invoice
      const existing = await db('daily_reminders')
        .where({
          scheduled_date: today,
          message: message
        })
        .first();

      if (!existing) {
        await db('daily_reminders').insert({
          scheduled_date: today,
          message,
          is_read: false,
          pushed_to_kafka: true
        });

        await kafkaService.emit(KafkaTopics.DAILY_REMINDER_TRIGGER, {
          schedule_id: item.schedule_id,
          party_id: item.party_id,
          phone: item.phone_primary,
          amount_due: item.amount_due,
          whatsapp_url: item.whatsapp_app_url
        });

        // Dispatch SMS to registered mobile number
        const smsMessage = `Payment Reminder: ₹${Number(item.amount_due).toLocaleString('en-IN')} for Invoice #${item.invoice_number} is pending. Please transfer to Bharat Diamond Bourse bank account. - BKC Desk`;
        await NotificationsService.sendSmsNotification({
          party_id: item.party_id,
          phone: item.phone_primary,
          message: smsMessage,
          reference_type: 'PAYMENT_REMINDER',
          reference_id: item.schedule_id
        });

        count++;
      }
    }

    // Cache active reminder queue in Redis for mobile instant sync
    await redisService.set('diamond:reminders:daily_queue', JSON.stringify(queue), 3600);

    return count;
  }

  public static async getFollowUpHistory(partyId?: string, limit = 50) {
    let q = db('follow_up_logs')
      .leftJoin('parties', 'follow_up_logs.party_id', 'parties.id')
      .leftJoin('users', 'follow_up_logs.caller_user_id', 'users.id')
      .select(
        'follow_up_logs.*',
        'parties.business_name',
        'parties.owner_name',
        'users.name as caller_name'
      )
      .orderBy('follow_up_logs.created_at', 'desc')
      .limit(limit);
    if (partyId) q = q.where('follow_up_logs.party_id', partyId);
    return q;
  }

  public static async markCallDone(scheduleId: string, data: {
    resolution: 'PAID' | 'PROMISED' | 'RESCHEDULED' | 'NO_ANSWER' | 'DISPUTED';
    note?: string;
    next_date?: string;
    caller_user_id?: string;
  }) {
    // Update schedule status
    const statusMap: Record<string, string> = {
      PAID: 'PAID',
      PROMISED: 'PROMISED',
      RESCHEDULED: 'PROMISED',
      NO_ANSWER: 'OVERDUE',
      DISPUTED: 'OVERDUE'
    };
    const newStatus = statusMap[data.resolution] || 'OVERDUE';

    await db('payment_schedules').where({ id: scheduleId }).update({
      status: newStatus,
      promised_date: data.next_date || null,
      updated_at: new Date()
    });

    // Insert call log
    const [log] = await db('follow_up_logs').insert({
      party_id: (await db('payment_schedules').where({ id: scheduleId }).select('party_id').first())?.party_id,
      call_date: new Date().toISOString().split('T')[0],
      caller_user_id: data.caller_user_id || null,
      client_response: `[${data.resolution}] ${data.note || ''}`.trim(),
      next_follow_up_date: data.next_date || null,
      created_at: new Date()
    }).returning('*');

    return { schedule_updated: newStatus, log };
  }

  public static async getDashboardStats() {
    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // Collection this month
    const collectedMonth = await db('payment_receipts')
      .where('receipt_date', '>=', thisMonthStart)
      .sum('amount_received as total')
      .first();

    // Pending count
    const pendingCount = await db('payment_schedules')
      .whereIn('status', ['PENDING', 'OVERDUE'])
      .count('id as cnt')
      .first();

    // Today's calls done
    const callsDone = await db('follow_up_logs')
      .where('call_date', todayStr)
      .count('id as cnt')
      .first();

    // Top buyers by sales volume (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
    const topBuyers = await db('sales_orders')
      .join('parties', 'sales_orders.buyer_id', 'parties.id')
      .where('sales_orders.created_at', '>=', ninetyDaysAgo)
      .whereNotIn('sales_orders.deal_status', ['CANCELLED'])
      .select('parties.business_name as name')
      .sum('sales_orders.net_amount as total_amount')
      .count('sales_orders.id as deal_count')
      .groupBy('parties.id', 'parties.business_name')
      .orderBy('total_amount', 'desc')
      .limit(8);

    // Follow-up counts per buyer (reliability score)
    const followUpCounts = await db('follow_up_logs')
      .join('parties', 'follow_up_logs.party_id', 'parties.id')
      .select('parties.business_name as name')
      .count('follow_up_logs.id as follow_up_count')
      .groupBy('parties.id', 'parties.business_name')
      .orderBy('follow_up_count', 'desc')
      .limit(8);

    // Monthly collection trend (last 6 months)
    const monthlyTrend = await db('payment_receipts')
      .select(db.raw(`to_char(receipt_date, 'YYYY-MM') as month`))
      .sum('amount_received as collected')
      .groupByRaw(`to_char(receipt_date, 'YYYY-MM')`)
      .orderBy('month', 'asc')
      .limit(6);

    return {
      collected_this_month: Number(collectedMonth?.total || 0),
      pending_follow_ups: Number(pendingCount?.cnt || 0),
      calls_done_today: Number(callsDone?.cnt || 0),
      top_buyers: topBuyers,
      follow_up_counts: followUpCounts,
      monthly_trend: monthlyTrend
    };
  }
}
