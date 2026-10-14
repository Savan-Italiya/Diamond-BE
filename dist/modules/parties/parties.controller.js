"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartiesController = void 0;
const parties_service_1 = require("./parties.service");
class PartiesController {
    static async getAll(req, res, next) {
        try {
            const { type, search } = req.query;
            const parties = await parties_service_1.PartiesService.getAllParties({
                type: type,
                search: search
            });
            res.status(200).json({
                success: true,
                count: parties.length,
                data: parties
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const party = await parties_service_1.PartiesService.getPartyById(req.params.id);
            res.status(200).json({
                success: true,
                data: party
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const newParty = await parties_service_1.PartiesService.createParty(req.body);
            res.status(201).json({
                success: true,
                message: 'Party created successfully',
                data: newParty
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const updated = await parties_service_1.PartiesService.updateParty(req.params.id, req.body);
            res.status(200).json({
                success: true,
                message: 'Party updated successfully',
                data: updated
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PartiesController = PartiesController;
//# sourceMappingURL=parties.controller.js.map