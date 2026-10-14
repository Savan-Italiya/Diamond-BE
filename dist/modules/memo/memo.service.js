"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoService = void 0;
const connection_1 = require("../../database/connection");
const error_middleware_1 = require("../../middleware/error.middleware");
const kafka_1 = require("../../config/kafka");
class MemoService {
    static async getAllMemos(filters) {
        let query = (0, connection_1.db)('memo_bills')
            .join('parties', 'memo_bills.party_id', 'parties.id')
            .leftJoin('brokers', 'memo_bills.broker_id', 'brokers.id')
            .leftJoin('parties as broker_party', 'brokers.party_id', 'broker_party.id')
            .select('memo_bills.*', 'parties.business_name as party_name', 'parties.phone_primary as party_phone', 'broker_party.business_name as broker_name');
        if (filters?.party_id)
            query = query.where('memo_bills.party_id', filters.party_id);
        if (filters?.status)
            query = query.where('memo_bills.status', filters.status);
        if (filters?.type)
            query = query.where('memo_bills.memo_type', filters.type);
        const memos = await query.orderBy('memo_bills.issue_date', 'desc');
        // Attach items count
        const memoIds = memos.map((m) => m.id);
        const items = await (0, connection_1.db)('memo_items').whereIn('memo_id', memoIds);
        const itemsMap = new Map();
        for (const item of items) {
            if (!itemsMap.has(item.memo_id))
                itemsMap.set(item.memo_id, []);
            itemsMap.get(item.memo_id)?.push(item);
        }
        return memos.map((m) => ({
            ...m,
            items: itemsMap.get(m.id) || []
        }));
    }
    static async getMemoById(id) {
        const memo = await (0, connection_1.db)('memo_bills')
            .join('parties', 'memo_bills.party_id', 'parties.id')
            .leftJoin('brokers', 'memo_bills.broker_id', 'brokers.id')
            .leftJoin('parties as broker_party', 'brokers.party_id', 'broker_party.id')
            .where('memo_bills.id', id)
            .select('memo_bills.*', 'parties.business_name as party_name', 'parties.phone_primary as party_phone', 'broker_party.business_name as broker_name')
            .first();
        if (!memo) {
            throw new error_middleware_1.AppError('Memo bill not found', 404, 'NOT_FOUND');
        }
        const items = await (0, connection_1.db)('memo_items')
            .leftJoin('diamond_lots', 'memo_items.lot_id', 'diamond_lots.id')
            .leftJoin('single_diamonds', 'memo_items.single_diamond_id', 'single_diamonds.id')
            .where('memo_items.memo_id', id)
            .select('memo_items.*', 'diamond_lots.lot_number', 'single_diamonds.cert_number', 'single_diamonds.shape', 'single_diamonds.color', 'single_diamonds.clarity');
        return { ...memo, items };
    }
    static async createMemo(data) {
        return await connection_1.db.transaction(async (trx) => {
            const existing = await trx('memo_bills').where({ memo_number: data.memo_number }).first();
            if (existing) {
                throw new error_middleware_1.AppError(`Memo #${data.memo_number} already exists`, 409, 'MEMO_EXISTS');
            }
            const [memo] = await trx('memo_bills')
                .insert({
                memo_number: data.memo_number,
                party_id: data.party_id,
                broker_id: data.broker_id || null,
                memo_type: data.memo_type,
                issue_date: data.issue_date,
                return_due_date: data.return_due_date,
                status: 'OPEN'
            })
                .returning('*');
            for (const item of data.items) {
                if (item.single_diamond_id) {
                    const diamond = await trx('single_diamonds').where({ id: item.single_diamond_id }).first();
                    if (!diamond || diamond.status !== 'IN_STOCK') {
                        throw new error_middleware_1.AppError(`Single diamond ${item.single_diamond_id} is not available for memo`, 400, 'DIAMOND_UNAVAILABLE');
                    }
                    await trx('single_diamonds').where({ id: item.single_diamond_id }).update({ status: 'MEMO' });
                }
                else if (item.lot_id) {
                    const lot = await trx('diamond_lots').where({ id: item.lot_id }).first();
                    if (!lot || Number(lot.current_carat) < item.carat) {
                        throw new error_middleware_1.AppError(`Insufficient carat in lot ${item.lot_id}`, 400, 'INSUFFICIENT_CARAT');
                    }
                }
                await trx('memo_items').insert({
                    memo_id: memo.id,
                    lot_id: item.lot_id || null,
                    single_diamond_id: item.single_diamond_id || null,
                    carat: item.carat,
                    asking_price: item.asking_price,
                    status: 'WITH_PARTY'
                });
            }
            await kafka_1.kafkaService.emit(kafka_1.KafkaTopics.STOCK_STATUS_CHANGED, {
                memo_id: memo.id,
                memo_number: memo.memo_number,
                action: 'MEMO_ISSUED'
            });
            return memo;
        });
    }
    static async returnMemoItem(memoItemId, returnedCarat, receivedByUserId, conditionNotes) {
        return await connection_1.db.transaction(async (trx) => {
            const item = await trx('memo_items').where({ id: memoItemId }).first();
            if (!item) {
                throw new error_middleware_1.AppError('Memo item not found', 404, 'NOT_FOUND');
            }
            if (item.status === 'RETURNED' || item.status === 'SOLD') {
                throw new error_middleware_1.AppError(`Memo item is already ${item.status}`, 400, 'INVALID_STATUS');
            }
            await trx('memo_return_logs').insert({
                memo_item_id: memoItemId,
                returned_carat: returnedCarat,
                received_by: receivedByUserId || null,
                condition_notes: conditionNotes || null
            });
            await trx('memo_items').where({ id: memoItemId }).update({ status: 'RETURNED' });
            // Restore diamond stock status
            if (item.single_diamond_id) {
                await trx('single_diamonds').where({ id: item.single_diamond_id }).update({ status: 'IN_STOCK' });
            }
            // Check if all items in memo are returned
            const remainingWithParty = await trx('memo_items')
                .where({ memo_id: item.memo_id, status: 'WITH_PARTY' })
                .count({ count: 'id' })
                .first();
            if (Number(remainingWithParty?.count || 0) === 0) {
                await trx('memo_bills').where({ id: item.memo_id }).update({ status: 'CLOSED' });
            }
            else {
                await trx('memo_bills').where({ id: item.memo_id }).update({ status: 'PARTIAL_RETURN' });
            }
            return { success: true, message: 'Memo item marked as returned' };
        });
    }
}
exports.MemoService = MemoService;
//# sourceMappingURL=memo.service.js.map