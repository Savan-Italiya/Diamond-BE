"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingService = void 0;
const connection_1 = require("../../database/connection");
const error_middleware_1 = require("../../middleware/error.middleware");
class ProcessingService {
    static async getAllSlips(filters) {
        let query = (0, connection_1.db)('repair_issue_slips')
            .join('parties', 'repair_issue_slips.processor_party_id', 'parties.id')
            .select('repair_issue_slips.*', 'parties.business_name as processor_name');
        if (filters?.processor_party_id)
            query = query.where('repair_issue_slips.processor_party_id', filters.processor_party_id);
        if (filters?.status)
            query = query.where('repair_issue_slips.status', filters.status);
        const slips = await query.orderBy('repair_issue_slips.created_at', 'desc');
        const slipIds = slips.map((s) => s.id);
        const items = await (0, connection_1.db)('repair_items')
            .leftJoin('repair_return_slips', 'repair_items.id', 'repair_return_slips.repair_item_id')
            .whereIn('repair_items.slip_id', slipIds)
            .select('repair_items.*', 'repair_return_slips.carat_loss', 'repair_return_slips.processing_charge');
        const itemsMap = new Map();
        for (const item of items) {
            if (!itemsMap.has(item.slip_id))
                itemsMap.set(item.slip_id, []);
            itemsMap.get(item.slip_id)?.push(item);
        }
        return slips.map((s) => ({
            ...s,
            items: itemsMap.get(s.id) || []
        }));
    }
    static async createRepairSlip(data) {
        return await connection_1.db.transaction(async (trx) => {
            const existing = await trx('repair_issue_slips').where({ slip_number: data.slip_number }).first();
            if (existing) {
                throw new error_middleware_1.AppError(`Repair slip #${data.slip_number} already exists`, 409, 'SLIP_EXISTS');
            }
            const [slip] = await trx('repair_issue_slips')
                .insert({
                slip_number: data.slip_number,
                issue_date: data.issue_date,
                processor_party_id: data.processor_party_id,
                expected_return_date: data.expected_return_date || null,
                status: 'IN_PROGRESS'
            })
                .returning('*');
            for (const item of data.items) {
                if (item.single_diamond_id) {
                    await trx('single_diamonds')
                        .where({ id: item.single_diamond_id })
                        .update({ status: 'IN_PROCESS' });
                }
                await trx('repair_items').insert({
                    slip_id: slip.id,
                    lot_id: item.lot_id || null,
                    single_diamond_id: item.single_diamond_id || null,
                    original_weight: item.original_weight,
                    reason: item.reason,
                    status: 'AT_WORKSHOP'
                });
            }
            return slip;
        });
    }
    static async returnRepairItem(data) {
        return await connection_1.db.transaction(async (trx) => {
            const item = await trx('repair_items').where({ id: data.repair_item_id }).first();
            if (!item) {
                throw new error_middleware_1.AppError('Repair item not found', 404, 'NOT_FOUND');
            }
            const caratLoss = Number(item.original_weight) - data.returned_weight;
            if (caratLoss < 0) {
                throw new error_middleware_1.AppError('Returned weight cannot exceed original weight', 400, 'INVALID_WEIGHT');
            }
            const [returnSlip] = await trx('repair_return_slips')
                .insert({
                repair_item_id: data.repair_item_id,
                returned_weight: data.returned_weight,
                carat_loss: caratLoss,
                processing_charge: data.processing_charge,
                return_date: data.return_date
            })
                .returning('*');
            await trx('repair_items').where({ id: data.repair_item_id }).update({ status: 'RETURNED' });
            // Update diamond weight and status
            if (item.single_diamond_id) {
                await trx('single_diamonds')
                    .where({ id: item.single_diamond_id })
                    .update({
                    carat: data.returned_weight,
                    status: 'IN_STOCK'
                });
            }
            // Check if all items in slip returned
            const pendingItems = await trx('repair_items')
                .where({ slip_id: item.slip_id, status: 'AT_WORKSHOP' })
                .count({ count: 'id' })
                .first();
            if (Number(pendingItems?.count || 0) === 0) {
                await trx('repair_issue_slips').where({ id: item.slip_id }).update({ status: 'COMPLETED' });
            }
            return returnSlip;
        });
    }
}
exports.ProcessingService = ProcessingService;
//# sourceMappingURL=processing.service.js.map