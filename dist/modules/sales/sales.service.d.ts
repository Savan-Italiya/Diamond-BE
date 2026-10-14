export declare class SalesService {
    static getAllSalesOrders(filters?: {
        buyer_id?: string;
        deal_status?: string;
    }): Promise<any[]>;
    static createSalesOrder(data: {
        buyer_id: string;
        broker_id?: string;
        invoice_number: string;
        discount_pct: number;
        payment_due_date: string;
        items: Array<{
            lot_id?: string;
            single_diamond_id?: string;
            carat: number;
            rate_per_carat: number;
        }>;
    }): Promise<any>;
    static getDebtorsAgeingAnalysis(): Promise<{
        under_30_days: any[];
        days_31_to_60: any[];
        days_61_to_90: any[];
        over_90_days: any[];
        total_outstanding: number;
    }>;
}
