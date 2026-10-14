export declare class AccountingService {
    static getPartyLedger(partyId: string, startDate?: string, endDate?: string): Promise<{
        party: {
            id: any;
            business_name: any;
            owner_name: any;
            party_type: any;
            current_running_balance: number;
        };
        entries: any[];
    }>;
    static recordPaymentReceipt(data: {
        party_id: string;
        amount_received: number;
        payment_mode: 'RTGS' | 'NEFT' | 'CHEQUE' | 'CASH' | 'UPI' | 'ANGDIA';
        reference_no?: string;
        payment_date: string;
        notes?: string;
        allocations?: Array<{
            sales_order_id: string;
            allocated_amount: number;
        }>;
    }): Promise<{
        receipt: any;
        new_balance: number;
    }>;
    static recordSupplierPayment(data: {
        seller_id: string;
        amount_paid: number;
        payment_mode: 'RTGS' | 'NEFT' | 'CHEQUE' | 'CASH' | 'UPI' | 'ANGDIA';
        reference_no?: string;
        payment_date: string;
    }): Promise<{
        payment: any;
        new_balance: number;
    }>;
}
