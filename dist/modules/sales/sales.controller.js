"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesController = void 0;
const sales_service_1 = require("./sales.service");
class SalesController {
    static async getAll(req, res, next) {
        try {
            const { buyer_id, deal_status } = req.query;
            const orders = await sales_service_1.SalesService.getAllSalesOrders({
                buyer_id: buyer_id,
                deal_status: deal_status
            });
            res.status(200).json({ success: true, count: orders.length, data: orders });
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const order = await sales_service_1.SalesService.createSalesOrder(req.body);
            res.status(201).json({ success: true, message: 'Sales order registered and ledger debited', data: order });
        }
        catch (err) {
            next(err);
        }
    }
    static async getDebtorsAgeing(_req, res, next) {
        try {
            const ageing = await sales_service_1.SalesService.getDebtorsAgeingAnalysis();
            res.status(200).json({ success: true, data: ageing });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SalesController = SalesController;
//# sourceMappingURL=sales.controller.js.map