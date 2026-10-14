"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingController = void 0;
const processing_service_1 = require("./processing.service");
class ProcessingController {
    static async getAll(req, res, next) {
        try {
            const { processor_party_id, status } = req.query;
            const slips = await processing_service_1.ProcessingService.getAllSlips({
                processor_party_id: processor_party_id,
                status: status
            });
            res.status(200).json({ success: true, count: slips.length, data: slips });
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const slip = await processing_service_1.ProcessingService.createRepairSlip(req.body);
            res.status(201).json({ success: true, message: 'Repair issue slip created', data: slip });
        }
        catch (err) {
            next(err);
        }
    }
    static async returnItem(req, res, next) {
        try {
            const returnSlip = await processing_service_1.ProcessingService.returnRepairItem(req.body);
            res.status(200).json({ success: true, message: 'Repair return recorded with carat loss', data: returnSlip });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ProcessingController = ProcessingController;
//# sourceMappingURL=processing.controller.js.map