"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingController = void 0;
const accounting_service_1 = require("./accounting.service");
class AccountingController {
    static async getLedger(req, res, next) {
        try {
            const { party_id } = req.params;
            const { start_date, end_date } = req.query;
            const ledger = await accounting_service_1.AccountingService.getPartyLedger(party_id, start_date, end_date);
            res.status(200).json({ success: true, data: ledger });
        }
        catch (err) {
            next(err);
        }
    }
    static async recordReceipt(req, res, next) {
        try {
            const result = await accounting_service_1.AccountingService.recordPaymentReceipt(req.body);
            res.status(201).json({ success: true, message: 'Payment receipt recorded and Khata updated', data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async recordSupplierPayment(req, res, next) {
        try {
            const result = await accounting_service_1.AccountingService.recordSupplierPayment(req.body);
            res.status(201).json({ success: true, message: 'Supplier payment recorded and Khata debited', data: result });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AccountingController = AccountingController;
//# sourceMappingURL=accounting.controller.js.map