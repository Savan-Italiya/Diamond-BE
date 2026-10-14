import { db } from '../../database/connection';
import { AppError } from '../../middleware/error.middleware';
import { kafkaService, KafkaTopics } from '../../config/kafka';

export class AccountingService {
  public static async getPartyLedger(partyId: string, startDate?: string, endDate?: string) {
    const party = await db('parties').where({ id: partyId }).first();
    if (!party) {
      throw new AppError('Party not found', 404, 'NOT_FOUND');
    }

    let query = db('party_ledgers')
      .where({ party_id: partyId })
      .orderBy('created_at', 'asc');

    if (startDate) query = query.where('created_at', '>=', startDate);
    if (endDate) query = query.where('created_at', '<=', `${endDate} 23:59:59`);

    const entries = await query;
    const latestBalance = entries.length > 0 ? Number(entries[entries.length - 1].running_balance) : 0;

    return {
      party: {
        id: party.id,
        business_name: party.business_name,
        owner_name: party.owner_name,
        party_type: party.party_type,
        current_running_balance: latestBalance
      },
      entries
    };
  }

  public static async recordPaymentReceipt(data: {
    party_id: string;
    amount_received: number;
    payment_mode: 'RTGS' | 'NEFT' | 'CHEQUE' | 'CASH' | 'UPI' | 'ANGDIA';
    reference_no?: string;
    payment_date: string;
    notes?: string;
    allocations?: Array<{ sales_order_id: string; allocated_amount: number }>;
  }) {
    return await db.transaction(async (trx) => {
      // 1. Insert Payment Receipt
      const [receipt] = await trx('payment_receipts')
        .insert({
          party_id: data.party_id,
          amount_received: data.amount_received,
          payment_mode: data.payment_mode,
          reference_no: data.reference_no || null,
          payment_date: data.payment_date,
          notes: data.notes || null
        })
        .returning('*');

      // 2. Double-entry Party Ledger (CREDIT buyer - reduces their debt)
      const lastLedger = await trx('party_ledgers')
        .where({ party_id: data.party_id })
        .orderBy('created_at', 'desc')
        .first();

      const previousBalance = lastLedger ? Number(lastLedger.running_balance) : 0;
      const newBalance = previousBalance - data.amount_received;

      await trx('party_ledgers').insert({
        party_id: data.party_id,
        entry_type: 'CREDIT',
        amount: data.amount_received,
        reference_type: 'PAYMENT_RECEIPT',
        reference_id: receipt.id,
        running_balance: newBalance
      });

      // 3. Process allocations to sales orders if provided
      if (data.allocations && data.allocations.length > 0) {
        for (const alloc of data.allocations) {
          await trx('payment_allocations').insert({
            receipt_id: receipt.id,
            sales_order_id: alloc.sales_order_id,
            allocated_amount: alloc.allocated_amount
          });

          // Check total payments against this sales order
          const totalAllocated = await trx('payment_allocations')
            .where({ sales_order_id: alloc.sales_order_id })
            .sum({ sum: 'allocated_amount' })
            .first();

          const order = await trx('sales_orders').where({ id: alloc.sales_order_id }).first();
          if (order) {
            const paid = Number(totalAllocated?.sum || 0);
            const net = Number(order.net_amount);
            const newStatus = paid >= net ? 'SETTLED' : 'PARTIAL';

            await trx('sales_orders')
              .where({ id: alloc.sales_order_id })
              .update({ deal_status: newStatus });

            // Update payment schedule
            const remainingDue = Math.max(0, net - paid);
            await trx('payment_schedules')
              .where({ sales_order_id: alloc.sales_order_id })
              .update({
                amount_due: remainingDue,
                status: remainingDue === 0 ? 'PAID' : 'PENDING'
              });
          }
        }
      }

      await kafkaService.emit(KafkaTopics.PAYMENT_RECEIVED, {
        receipt_id: receipt.id,
        party_id: data.party_id,
        amount_received: data.amount_received,
        payment_date: data.payment_date
      });

      return { receipt, new_balance: newBalance };
    });
  }

  public static async recordSupplierPayment(data: {
    seller_id: string;
    amount_paid: number;
    payment_mode: 'RTGS' | 'NEFT' | 'CHEQUE' | 'CASH' | 'UPI' | 'ANGDIA';
    reference_no?: string;
    payment_date: string;
  }) {
    return await db.transaction(async (trx) => {
      const [payment] = await trx('supplier_payments')
        .insert({
          seller_id: data.seller_id,
          amount_paid: data.amount_paid,
          payment_mode: data.payment_mode,
          reference_no: data.reference_no || null,
          payment_date: data.payment_date
        })
        .returning('*');

      const lastLedger = await trx('party_ledgers')
        .where({ party_id: data.seller_id })
        .orderBy('created_at', 'desc')
        .first();

      const previousBalance = lastLedger ? Number(lastLedger.running_balance) : 0;
      const newBalance = previousBalance + data.amount_paid; // Paying supplier reduces credit (increases running balance towards 0)

      await trx('party_ledgers').insert({
        party_id: data.seller_id,
        entry_type: 'DEBIT',
        amount: data.amount_paid,
        reference_type: 'SUPPLIER_PAYMENT',
        reference_id: payment.id,
        running_balance: newBalance
      });

      return { payment, new_balance: newBalance };
    });
  }
}
