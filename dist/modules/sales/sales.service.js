"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const connection_1 = require("../../database/connection");
const error_middleware_1 = require("../../middleware/error.middleware");
const kafka_1 = require("../../config/kafka");
class SalesService {
    static async getAllSalesOrders(filters) {
        let query = (0, connection_1.db)('sales_orders')
            .join('parties as buyer', 'sales_orders.buyer_id', 'buyer.id')
            .leftJoin('brokers', 'sales_orders.broker_id', 'brokers.id')
            .leftJoin('parties as broker_party', 'brokers.party_id', 'broker_party.id')
            .select('sales_orders.*', 'buyer.business_name as buyer_name', 'buyer.phone_primary as buyer_phone', 'broker_party.business_name as broker_name');
        if (filters?.buyer_id)
            query = query.where('sales_orders.buyer_id', filters.buyer_id);
        if (filters?.deal_status)
            query = query.where('sales_orders.deal_status', filters.deal_status);
        const orders = await query.orderBy('sales_orders.created_at', 'desc');
        const orderIds = orders.map((o) => o.id);
        const items = await (0, connection_1.db)('sales_items').whereIn('sales_id', orderIds);
        const itemsMap = new Map();
        for (const item of items) {
            if (!itemsMap.has(item.sales_id))
                itemsMap.set(item.sales_id, []);
            itemsMap.get(item.sales_id)?.push(item);
        }
        return orders.map((o) => ({
            ...o,
            items: itemsMap.get(o.id) || []
        }));
    }
    static async createSalesOrder(data) {
        return await connection_1.db.transaction(async (trx) => {
            const existing = await trx('sales_orders').where({ invoice_number: data.invoice_number }).first();
            if (existing) {
                throw new error_middleware_1.AppError(`Invoice #${data.invoice_number} already exists`, 409, 'INVOICE_EXISTS');
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
                        throw new error_middleware_1.AppError(`Single diamond ${item.single_diamond_id} is already sold`, 400, 'ALREADY_SOLD');
                    }
                    await trx('single_diamonds').where({ id: item.single_diamond_id }).update({ status: 'SOLD' });
                }
                else if (item.lot_id) {
                    const lot = await trx('diamond_lots').where({ id: item.lot_id }).first();
                    if (!lot || Number(lot.current_carat) < item.carat) {
                        throw new error_middleware_1.AppError(`Insufficient carats in lot ${item.lot_id}`, 400, 'INSUFFICIENT_STOCK');
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
            await kafka_1.kafkaService.emit(kafka_1.KafkaTopics.STOCK_STATUS_CHANGED, {
                sales_id: salesOrder.id,
                invoice_number: salesOrder.invoice_number,
                total_carat: totalCarat
            });
            await kafka_1.kafkaService.emit(kafka_1.KafkaTopics.PAYMENT_DUE_ALERT, {
                sales_order_id: salesOrder.id,
                buyer_id: data.buyer_id,
                due_date: data.payment_due_date,
                amount: netAmount
            });
            return salesOrder;
        });
    }
    static async getDebtorsAgeingAnalysis() {
        const today = new Date().toISOString().split('T')[0];
        const schedules = await (0, connection_1.db)('payment_schedules')
            .join('parties', 'payment_schedules.party_id', 'parties.id')
            .join('sales_orders', 'payment_schedules.sales_order_id', 'sales_orders.id')
            .whereIn('payment_schedules.status', ['PENDING', 'OVERDUE'])
            .select('payment_schedules.*', 'parties.business_name', 'parties.owner_name', 'parties.phone_primary', 'sales_orders.invoice_number');
        const result = {
            under_30_days: [],
            days_31_to_60: [],
            days_61_to_90: [],
            over_90_days: [],
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
            }
            else if (diffDays <= 60) {
                result.days_31_to_60.push(item);
            }
            else if (diffDays <= 90) {
                result.days_61_to_90.push(item);
            }
            else {
                result.over_90_days.push(item);
            }
        }
        return result;
    }
}
exports.SalesService = SalesService;
//# sourceMappingURL=sales.service.js.map