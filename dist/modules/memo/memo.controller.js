"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoController = void 0;
const memo_service_1 = require("./memo.service");
class MemoController {
    static async getAll(req, res, next) {
        try {
            const { party_id, status, type } = req.query;
            const memos = await memo_service_1.MemoService.getAllMemos({
                party_id: party_id,
                status: status,
                type: type
            });
            res.status(200).json({ success: true, count: memos.length, data: memos });
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const memo = await memo_service_1.MemoService.getMemoById(req.params.id);
            res.status(200).json({ success: true, data: memo });
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const memo = await memo_service_1.MemoService.createMemo(req.body);
            res.status(201).json({ success: true, message: 'Memo challan created successfully', data: memo });
        }
        catch (err) {
            next(err);
        }
    }
    static async returnItem(req, res, next) {
        try {
            const { memo_item_id, returned_carat, condition_notes } = req.body;
            const result = await memo_service_1.MemoService.returnMemoItem(memo_item_id, returned_carat, req.user?.userId, condition_notes);
            res.status(200).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.MemoController = MemoController;
//# sourceMappingURL=memo.controller.js.map