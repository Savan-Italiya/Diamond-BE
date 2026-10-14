"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartiesService = void 0;
const connection_1 = require("../../database/connection");
const error_middleware_1 = require("../../middleware/error.middleware");
class PartiesService {
    static async getAllParties(filters) {
        let query = (0, connection_1.db)('parties').select('*');
        if (filters?.type) {
            query = query.where('party_type', filters.type);
        }
        if (filters?.search) {
            const s = `%${filters.search}%`;
            query = query.where((builder) => {
                builder.whereILike('business_name', s).orWhereILike('phone_primary', s).orWhereILike('owner_name', s);
            });
        }
        const parties = await query.orderBy('business_name', 'asc');
        // Attach latest running ledger balance for each party
        const partyIds = parties.map((p) => p.id);
        const latestBalances = await (0, connection_1.db)('party_ledgers')
            .whereIn('party_id', partyIds)
            .distinctOn('party_id')
            .orderBy('party_id')
            .orderBy('created_at', 'desc')
            .select('party_id', 'running_balance');
        const balanceMap = new Map(latestBalances.map((b) => [b.party_id, Number(b.running_balance)]));
        return parties.map((p) => ({
            ...p,
            current_balance: balanceMap.get(p.id) || 0.00
        }));
    }
    static async getPartyById(id) {
        const party = await (0, connection_1.db)('parties').where({ id }).first();
        if (!party) {
            throw new error_middleware_1.AppError('Party not found', 404, 'NOT_FOUND');
        }
        const address = await (0, connection_1.db)('party_addresses').where({ party_id: id }).first();
        const bankDetails = await (0, connection_1.db)('party_bank_details').where({ party_id: id }).first();
        const brokerDetails = party.party_type === 'BROKER' ? await (0, connection_1.db)('brokers').where({ party_id: id }).first() : null;
        const latestLedger = await (0, connection_1.db)('party_ledgers')
            .where({ party_id: id })
            .orderBy('created_at', 'desc')
            .first();
        return {
            ...party,
            address,
            bank_details: bankDetails,
            broker_details: brokerDetails,
            current_balance: latestLedger ? Number(latestLedger.running_balance) : 0.00
        };
    }
    static async createParty(data) {
        return await connection_1.db.transaction(async (trx) => {
            const [newParty] = await trx('parties')
                .insert({
                business_name: data.business_name,
                owner_name: data.owner_name,
                phone_primary: data.phone_primary,
                phone_secondary: data.phone_secondary || null,
                gstin: data.gstin || null,
                pan: data.pan || null,
                party_type: data.party_type,
                credit_limit: data.credit_limit || 0
            })
                .returning('*');
            if (data.address) {
                await trx('party_addresses').insert({
                    party_id: newParty.id,
                    address_line: data.address.address_line,
                    city: data.address.city || 'Mumbai',
                    state: data.address.state || 'Maharashtra',
                    pincode: data.address.pincode
                });
            }
            if (data.bank_details) {
                await trx('party_bank_details').insert({
                    party_id: newParty.id,
                    bank_name: data.bank_details.bank_name,
                    account_no: data.bank_details.account_no,
                    ifsc: data.bank_details.ifsc,
                    upi_id: data.bank_details.upi_id || null
                });
            }
            if (data.party_type === 'BROKER') {
                await trx('brokers').insert({
                    party_id: newParty.id,
                    default_commission_rate: data.default_commission_rate || 1.00
                });
            }
            return newParty;
        });
    }
    static async updateParty(id, data) {
        const existing = await (0, connection_1.db)('parties').where({ id }).first();
        if (!existing) {
            throw new error_middleware_1.AppError('Party not found', 404, 'NOT_FOUND');
        }
        const { address, bank_details, default_commission_rate, ...partyFields } = data;
        await connection_1.db.transaction(async (trx) => {
            if (Object.keys(partyFields).length > 0) {
                await trx('parties')
                    .where({ id })
                    .update({
                    ...partyFields,
                    updated_at: trx.fn.now()
                });
            }
            if (address) {
                const existingAddress = await trx('party_addresses').where({ party_id: id }).first();
                if (existingAddress) {
                    await trx('party_addresses').where({ party_id: id }).update(address);
                }
                else {
                    await trx('party_addresses').insert({ party_id: id, ...address });
                }
            }
            if (bank_details) {
                const existingBank = await trx('party_bank_details').where({ party_id: id }).first();
                if (existingBank) {
                    await trx('party_bank_details').where({ party_id: id }).update(bank_details);
                }
                else {
                    await trx('party_bank_details').insert({ party_id: id, ...bank_details });
                }
            }
            if (default_commission_rate !== undefined && existing.party_type === 'BROKER') {
                await trx('brokers')
                    .where({ party_id: id })
                    .update({ default_commission_rate });
            }
        });
        return this.getPartyById(id);
    }
}
exports.PartiesService = PartiesService;
//# sourceMappingURL=parties.service.js.map