"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const inventory_service_1 = require("./inventory.service");
class InventoryController {
    static async getLots(req, res, next) {
        try {
            const { status, search } = req.query;
            const lots = await inventory_service_1.InventoryService.getLots({
                status: status,
                search: search
            });
            res.status(200).json({ success: true, count: lots.length, data: lots });
        }
        catch (err) {
            next(err);
        }
    }
    static async getSingleDiamonds(req, res, next) {
        try {
            const diamonds = await inventory_service_1.InventoryService.getSingleDiamonds(req.query);
            res.status(200).json({ success: true, count: diamonds.length, data: diamonds });
        }
        catch (err) {
            next(err);
        }
    }
    static async createLot(req, res, next) {
        try {
            const lot = await inventory_service_1.InventoryService.createLot(req.body);
            res.status(201).json({ success: true, message: 'Lot created successfully', data: lot });
        }
        catch (err) {
            next(err);
        }
    }
    static async createSingleDiamond(req, res, next) {
        try {
            const diamond = await inventory_service_1.InventoryService.createSingleDiamond(req.body);
            res.status(201).json({ success: true, message: 'Certified diamond created successfully', data: diamond });
        }
        catch (err) {
            next(err);
        }
    }
    static async breakdownLot(req, res, next) {
        try {
            const { parent_lot_id, new_lot_number, carats_transferred, cost_per_carat } = req.body;
            const result = await inventory_service_1.InventoryService.breakdownLot(parent_lot_id, new_lot_number, carats_transferred, cost_per_carat);
            res.status(200).json({ success: true, message: 'Lot breakdown executed successfully', data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async stockAudit(req, res, next) {
        try {
            const auditLog = await inventory_service_1.InventoryService.recordStockAudit({
                ...req.body,
                checked_by: req.user?.userId
            });
            res.status(201).json({ success: true, message: 'Stock audit logged successfully', data: auditLog });
        }
        catch (err) {
            next(err);
        }
    }
    static async getSummary(_req, res, next) {
        try {
            const summary = await inventory_service_1.InventoryService.getStockSummary();
            res.status(200).json({ success: true, data: summary });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.InventoryController = InventoryController;
//# sourceMappingURL=inventory.controller.js.map