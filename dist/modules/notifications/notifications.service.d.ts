export declare class NotificationsService {
    static getTemplates(): Promise<any[]>;
    static queueNotification(data: {
        party_id: string;
        channel: 'PUSH' | 'SMS' | 'WHATSAPP';
        payload: Record<string, any>;
    }): Promise<any>;
    static generateWhatsAppMessage(templateName: string, params: Record<string, string>): Promise<string>;
}
