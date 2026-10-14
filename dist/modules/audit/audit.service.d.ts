export declare class AuditService {
    static getLogs(filters?: {
        table_name?: string;
        record_id?: string;
        user_id?: string;
    }): Promise<any[]>;
    static getReportSchedules(): Promise<any[]>;
    static createReportSchedule(data: {
        report_type: string;
        recipient_phone: string;
        cron_expression?: string;
    }): Promise<any>;
}
