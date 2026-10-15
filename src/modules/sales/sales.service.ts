import { db } from '../../database/connection';
import { AppError } from '../../middleware/error.middleware';
import { kafkaService, KafkaTopics } from '../../config/kafka';

export class SalesService {
  public static async getAllSalesOrders(filters?: {
    buyer_id?: string;
    deal_status?: string;
    user_id?: string;
    organization_id?: string;
  }) {
    let query = db('sales_orders')
      .join('parties as buyer', 'sales_orders.buyer_id', 'buyer.id')
      .leftJoin('brokers', 'sales_orders.broker_id', 'brokers.id')
      .leftJoin('parties as broker_party', 'brokers.party_id', 'broker_party.id')
      .select(
        'sales_orders.*',
        'buyer.business_name as buyer_name',
        'buyer.phone_primary as buyer_phone',
        'broker_party.business_name as broker_name'
      );

    if (filters?.buyer_id) query = query.where('sales_orders.buyer_id', filters.buyer_id);
    if (filters?.deal_status) query = query.where('sales_orders.deal_status', filters.deal_status);
    if (filters?.user_id) query = query.where('sales_orders.created_by_user_id', filters.user_id);
    if (filters?.organization_id) query = query.where('sales_orders.organization_id', filters.organization_id);

    const orders = await query.orderBy('sales_orders.created_at', 'desc');

    const orderIds = orders.map((o) => o.id);
    const items = await db('sales_items').whereIn('sales_id', orderIds);

    const itemsMap = new Map<string, any[]>();
    for (const item of items) {
      if (!itemsMap.has(item.sales_id)) itemsMap.set(item.sales_id, []);
      itemsMap.get(item.sales_id)?.push(item);
    }

    return orders.map((o) => ({
      ...o,
      items: itemsMap.get(o.id) || []
    }));
  }

  public static async createSalesOrder(data: {
    buyer_id: string;
    broker_id?: string;
    invoice_number: string;
    discount_pct: number;
    payment_due_date: string;
    items: Array<{
      lot_id?: string;
      single_diamond_id?: string;
      carat: number;
      rate_per_carat: number;
    }>;
  }) {
    return await db.transaction(async (trx) => {
      const existing = await trx('sales_orders').where({ invoice_number: data.invoice_number }).first();
      if (existing) {
        throw new AppError(`Invoice #${data.invoice_number} already exists`, 409, 'INVOICE_EXISTS');
      }

      let totalCarat = 0;
      let grossAmount = 0;

      for (const item of data.items) {
        totalCarat += item.carat;
        grossAmount += item.carat * item.rate_per_carat;

        // Verify and update stock status
        if (item.single_diamond_id) {
          const diamond = await trx('single_diamonds').where({ id: item.single_diamond_id }).first();
          if (!diamond || diamond.status === 'SOLD') {
            throw new AppError(`Single diamond ${item.single_diamond_id} is already sold`, 400, 'ALREADY_SOLD');
          }
          await trx('single_diamonds').where({ id: item.single_diamond_id }).update({ status: 'SOLD' });
        } else if (item.lot_id) {
          const lot = await trx('diamond_lots').where({ id: item.lot_id }).first();
          if (!lot || Number(lot.current_carat) < item.carat) {
            throw new AppError(`Insufficient carats in lot ${item.lot_id}`, 400, 'INSUFFICIENT_STOCK');
          }
          const updatedCarat = Number(lot.current_carat) - item.carat;
          await trx('diamond_lots')
            .where({ id: item.lot_id })
            .update({
              current_carat: updatedCarat,
              status: updatedCarat <= 0 ? 'SOLD' : lot.status
            });
        }
      }

      const discountAmt = (grossAmount * data.discount_pct) / 100;
      const netAmount = grossAmount - discountAmt;

      // 1. Insert Sales Order
      const [salesOrder] = await trx('sales_orders')
        .insert({
          buyer_id: data.buyer_id,
          broker_id: data.broker_id || null,
          invoice_number: data.invoice_number,
          total_carat: totalCarat,
          gross_amount: grossAmount,
          discount_pct: data.discount_pct,
          net_amount: netAmount,
          payment_due_date: data.payment_due_date,
          deal_status: 'UNPAID'
        })
        .returning('*');

      // 2. Insert Sales Items
      for (const item of data.items) {
        await trx('sales_items').insert({
          sales_id: salesOrder.id,
          lot_id: item.lot_id || null,
          single_diamond_id: item.single_diamond_id || null,
          carat: item.carat,
          rate_per_carat: item.rate_per_carat,
          total_price: item.carat * item.rate_per_carat
        });
      }

      // 3. Double-entry Party Ledger (DEBIT buyer for goods sold)
      const lastLedger = await trx('party_ledgers')
        .where({ party_id: data.buyer_id })
        .orderBy('created_at', 'desc')
        .first();

      const previousBalance = lastLedger ? Number(lastLedger.running_balance) : 0;
      const newBalance = previousBalance + netAmount; // Debit increases buyer's payable to us

      await trx('party_ledgers').insert({
        party_id: data.buyer_id,
        entry_type: 'DEBIT',
        amount: netAmount,
        reference_type: 'SALES_INVOICE',
        reference_id: salesOrder.id,
        running_balance: newBalance
      });

      // 4. Brokerage Ledger calculation
      if (data.broker_id) {
        const broker = await trx('brokers').where({ id: data.broker_id }).first();
        const commissionPct = broker ? Number(broker.default_commission_rate) : 1.0;
        const totalBrokerage = (netAmount * commissionPct) / 100;

        await trx('brokerage_ledgers').insert({
          transaction_type: 'SALE',
          transaction_id: salesOrder.id,
          broker_id: data.broker_id,
          commission_pct: commissionPct,
          total_brokerage_amount: totalBrokerage,
          payment_status: 'PENDING'
        });
      }

      // 5. Payment Schedule setup
      await trx('payment_schedules').insert({
        sales_order_id: salesOrder.id,
        party_id: data.buyer_id,
        due_date: data.payment_due_date,
        amount_due: netAmount,
        status: 'PENDING'
      });

      // 6. Emit Kafka events
      await kafkaService.emit(KafkaTopics.STOCK_STATUS_CHANGED, {
        sales_id: salesOrder.id,
        invoice_number: salesOrder.invoice_number,
        total_carat: totalCarat
      });

      await kafkaService.emit(KafkaTopics.PAYMENT_DUE_ALERT, {
        sales_order_id: salesOrder.id,
        buyer_id: data.buyer_id,
        due_date: data.payment_due_date,
        amount: netAmount
      });

      return salesOrder;
    });
  }

  public static async getMyStats() {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';

    const [todayStats, monthStats, pendingStats] = await Promise.all([
      db('sales_orders').where('created_at', '>=', today).select(
        db.raw('COUNT(*) as count'),
        db.raw('COALESCE(SUM(net_amount), 0) as total')
      ).first(),
      db('sales_orders').where('created_at', '>=', monthStart).select(
        db.raw('COUNT(*) as count'),
        db.raw('COALESCE(SUM(net_amount), 0) as total')
      ).first(),
      db('sales_orders').whereNotIn('deal_status', ['PAID', 'SETTLED', 'CANCELLED']).select(
        db.raw('COALESCE(SUM(net_amount), 0) as total')
      ).first()
    ]);

    return {
      today_count: Number(todayStats?.count || 0),
      today_amount: Number(todayStats?.total || 0),
      month_count: Number(monthStats?.count || 0),
      month_amount: Number(monthStats?.total || 0),
      total_pending: Number(pendingStats?.total || 0)
    };
  }

  public static async markPaymentComplete(salesOrderId: string, userId: string) {
    return await db.transaction(async (trx) => {
      const order = await trx('sales_orders').where({ id: salesOrderId }).first();
      if (!order) throw new AppError('Sales order not found', 404, 'NOT_FOUND');
      if (order.deal_status === 'PAID') throw new AppError('Invoice already marked as paid', 409, 'ALREADY_PAID');

      const amountDue = Number(order.net_amount);

      // Mark sales order as PAID
      await trx('sales_orders').where({ id: salesOrderId }).update({ deal_status: 'PAID' });

      // Mark all pending payment schedules as PAID
      await trx('payment_schedules')
        .where({ sales_order_id: salesOrderId })
        .whereIn('status', ['PENDING', 'OVERDUE', 'PARTIAL'])
        .update({ status: 'PAID', paid_at: trx.fn.now() });

      // Credit party ledger
      const lastLedger = await trx('party_ledgers')
        .where({ party_id: order.buyer_id })
        .orderBy('created_at', 'desc')
        .first();
      const previousBalance = lastLedger ? Number(lastLedger.running_balance) : 0;
      const newBalance = previousBalance - amountDue;

      await trx('party_ledgers').insert({
        party_id: order.buyer_id,
        entry_type: 'CREDIT',
        amount: amountDue,
        reference_type: 'PAYMENT_RECEIPT',
        reference_id: salesOrderId,
        running_balance: newBalance,
        remarks: `Full payment received for Invoice #${order.invoice_number}`
      });

      // Emit Kafka event
      await kafkaService.emit(KafkaTopics.PAYMENT_DUE_ALERT, {
        event: 'PAYMENT_COMPLETED',
        sales_order_id: salesOrderId,
        invoice_number: order.invoice_number,
        amount: amountDue,
        user_id: userId
      });

      return { invoice_number: order.invoice_number, amount_paid: amountDue, status: 'PAID' };
    });
  }

  public static async recordPartialPayment(data: {
    sales_order_id: string;
    amount_received: number;
    payment_mode: string;
    payment_reference?: string;
    next_promise_date?: string;
    remarks?: string;
    user_id: string;
  }) {
    return await db.transaction(async (trx) => {
      const order = await trx('sales_orders').where({ id: data.sales_order_id }).first();
      if (!order) throw new AppError('Sales order not found', 404, 'NOT_FOUND');
      if (order.deal_status === 'PAID') throw new AppError('Invoice already fully paid', 409, 'ALREADY_PAID');

      // Insert payment receipt
      const [receipt] = await trx('payment_receipts').insert({
        party_id: order.buyer_id,
        sales_order_id: data.sales_order_id,
        amount_received: data.amount_received,
        payment_mode: data.payment_mode,
        payment_reference: data.payment_reference || null,
        received_at: trx.fn.now(),
        remarks: data.remarks || null
      }).returning('*');

      // Credit party ledger
      const lastLedger = await trx('party_ledgers')
        .where({ party_id: order.buyer_id })
        .orderBy('created_at', 'desc')
        .first();
      const previousBalance = lastLedger ? Number(lastLedger.running_balance) : 0;
      const newBalance = previousBalance - data.amount_received;

      await trx('party_ledgers').insert({
        party_id: order.buyer_id,
        entry_type: 'CREDIT',
        amount: data.amount_received,
        reference_type: 'PARTIAL_PAYMENT',
        reference_id: receipt.id,
        running_balance: newBalance,
        remarks: `Partial receipt via ${data.payment_mode} for Invoice #${order.invoice_number}`
      });

      // Calculate total received so far
      const receipts = await trx('payment_receipts').where({ sales_order_id: data.sales_order_id });
      const totalReceived = receipts.reduce((sum: number, r: any) => sum + Number(r.amount_received), 0);
      const netAmount = Number(order.net_amount);
      const remaining = netAmount - totalReceived;

      let newStatus = remaining <= 0 ? 'PAID' : 'PARTIAL';
      await trx('sales_orders').where({ id: data.sales_order_id }).update({ deal_status: newStatus });

      // Update payment schedule
      if (data.next_promise_date && remaining > 0) {
        await trx('payment_schedules')
          .where({ sales_order_id: data.sales_order_id })
          .whereIn('status', ['PENDING', 'OVERDUE', 'PARTIAL'])
          .update({
            status: 'PARTIAL',
            amount_due: remaining,
            due_date: data.next_promise_date,
            promised_date: data.next_promise_date
          });

        // Schedule follow-up reminder via Kafka
        await kafkaService.emit(KafkaTopics.PAYMENT_DUE_ALERT, {
          event: 'PARTIAL_PAYMENT_RECEIVED',
          sales_order_id: data.sales_order_id,
          invoice_number: order.invoice_number,
          amount_received: data.amount_received,
          remaining: remaining,
          next_promise_date: data.next_promise_date
        });
      }

      return {
        receipt_id: receipt.id,
        amount_received: data.amount_received,
        total_received: totalReceived,
        remaining_balance: Math.max(0, remaining),
        deal_status: newStatus
      };
    });
  }

  public static async reschedulePaymentDate(data: {
    sales_order_id: string;
    new_promised_date: string;
    reason?: string;
    user_id: string;
  }) {
    const order = await db('sales_orders').where({ id: data.sales_order_id }).first();
    if (!order) throw new AppError('Sales order not found', 404, 'NOT_FOUND');

    await db('payment_schedules')
      .where({ sales_order_id: data.sales_order_id })
      .whereIn('status', ['PENDING', 'OVERDUE', 'PARTIAL'])
      .update({ promised_date: data.new_promised_date, status: 'PENDING' });

    // Create a follow-up reminder for the promised date
    await db('daily_reminders').insert({
      party_id: order.buyer_id,
      sales_order_id: data.sales_order_id,
      reminder_date: data.new_promised_date,
      reminder_type: 'PROMISED_DATE_FOLLOWUP',
      message: `Payment promised for Invoice #${order.invoice_number} due on ${data.new_promised_date}. Reason: ${data.reason || 'Rescheduled by trader'}`,
      status: 'PENDING'
    });

    // Emit Kafka notification
    await kafkaService.emit(KafkaTopics.PAYMENT_DUE_ALERT, {
      event: 'PAYMENT_RESCHEDULED',
      sales_order_id: data.sales_order_id,
      invoice_number: order.invoice_number,
      buyer_id: order.buyer_id,
      new_promised_date: data.new_promised_date,
      reason: data.reason
    });

    return { invoice_number: order.invoice_number, new_promised_date: data.new_promised_date };
  }

  public static async getPaymentHistory(salesOrderId: string) {
    const order = await db('sales_orders').where({ id: salesOrderId }).first();
    if (!order) throw new AppError('Sales order not found', 404, 'NOT_FOUND');

    const receipts = await db('payment_receipts')
      .where({ sales_order_id: salesOrderId })
      .orderBy('received_at', 'desc');

    const totalReceived = receipts.reduce((sum: number, r: any) => sum + Number(r.amount_received), 0);
    const remaining = Number(order.net_amount) - totalReceived;

    return {
      order_id: salesOrderId,
      invoice_number: order.invoice_number,
      net_amount: Number(order.net_amount),
      total_received: totalReceived,
      remaining_balance: Math.max(0, remaining),
      deal_status: order.deal_status,
      receipts
    };
  }

  public static async getDebtorsAgeingAnalysis() {
    const today = new Date().toISOString().split('T')[0];

    const schedules = await db('payment_schedules')
      .join('parties', 'payment_schedules.party_id', 'parties.id')
      .join('sales_orders', 'payment_schedules.sales_order_id', 'sales_orders.id')
      .whereIn('payment_schedules.status', ['PENDING', 'OVERDUE'])
      .select(
        'payment_schedules.*',
        'parties.business_name',
        'parties.owner_name',
        'parties.phone_primary',
        'sales_orders.invoice_number'
      );

    const result = {
      under_30_days: [] as any[],
      days_31_to_60: [] as any[],
      days_61_to_90: [] as any[],
      over_90_days: [] as any[],
      total_outstanding: 0
    };

    const nowMs = new Date(today).getTime();

    for (const s of schedules) {
      const dueMs = new Date(s.due_date).getTime();
      const diffDays = Math.floor((nowMs - dueMs) / (1000 * 60 * 60 * 24));
      const amount = Number(s.amount_due);

      result.total_outstanding += amount;

      const item = { ...s, days_overdue: Math.max(0, diffDays) };

      if (diffDays <= 0 || diffDays <= 30) {
        result.under_30_days.push(item);
      } else if (diffDays <= 60) {
        result.days_31_to_60.push(item);
      } else if (diffDays <= 90) {
        result.days_61_to_90.push(item);
      } else {
        result.over_90_days.push(item);
      }
    }

    return result;
  }
}
