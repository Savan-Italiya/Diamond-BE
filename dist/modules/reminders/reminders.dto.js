"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSchedulePromiseSchema = exports.logFollowUpSchema = void 0;
const zod_1 = require("zod");
exports.logFollowUpSchema = zod_1.z.object({
    party_id: zod_1.z.string().uuid(),
    call_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    client_response: zod_1.z.string().min(2),
    next_follow_up_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    audio_note_url: zod_1.z.string().url().optional()
});
exports.updateSchedulePromiseSchema = zod_1.z.object({
    schedule_id: zod_1.z.string().uuid(),
    promised_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
//# sourceMappingURL=reminders.dto.js.map