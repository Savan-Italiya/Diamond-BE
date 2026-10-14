"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const connection_1 = require("../../database/connection");
class AuditService {
    static async getLogs(filters) {
        let query = (0, connection_1.db)('system_audit_logs')
            .leftJoin('users', 'system_audit_logs.user_id', 'users.id')
            .select('system_audit_logs.*', 'users.name as user_name', 'users.email as user_email');
        if (filters?.table_name)
            query = query.where('table_name', filters.table_name);
        if (filters?.record_id)
            query = query.where('record_id', filters.record_id);
        if (filters?.user_id)
            query = query.where('user_id', filters.user_id);
        return await query.orderBy('timestamp', 'desc').limit(100);
    }
    static async getReportSchedules() {
        return await (0, connection_1.db)('report_schedules').select('*').orderBy('created_at', 'desc');
    }
    static async createReportSchedule(data) {
        const [report] = await (0, connection_1.db)('report_schedules')
            .insert({
            report_type: data.report_type,
            recipient_phone: data.recipient_phone,
            cron_expression: data.cron_expression || '0 9 * * *',
            status: 'ACTIVE'
        })
            .returning('*');
        return report;
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=audit.service.js.map