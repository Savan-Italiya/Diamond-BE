import { db } from '../../database/connection';

export class AuditService {
  public static async getLogs(filters?: { table_name?: string; record_id?: string; user_id?: string }) {
    let query = db('system_audit_logs')
      .leftJoin('users', 'system_audit_logs.user_id', 'users.id')
      .select('system_audit_logs.*', 'users.name as user_name', 'users.email as user_email');

    if (filters?.table_name) query = query.where('table_name', filters.table_name);
    if (filters?.record_id) query = query.where('record_id', filters.record_id);
    if (filters?.user_id) query = query.where('user_id', filters.user_id);

    return await query.orderBy('timestamp', 'desc').limit(100);
  }

  public static async getReportSchedules() {
    return await db('report_schedules').select('*').orderBy('created_at', 'desc');
  }

  public static async createReportSchedule(data: {
    report_type: string;
    recipient_phone: string;
    cron_expression?: string;
  }) {
    const [report] = await db('report_schedules')
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
