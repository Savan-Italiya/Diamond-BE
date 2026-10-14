export declare class ProcessingService {
    static getAllSlips(filters?: {
        processor_party_id?: string;
        status?: string;
    }): Promise<any[]>;
    static createRepairSlip(data: {
        slip_number: string;
        issue_date: string;
        processor_party_id: string;
        expected_return_date?: string;
        items: Array<{
            lot_id?: string;
            single_diamond_id?: string;
            original_weight: number;
            reason: string;
        }>;
    }): Promise<any>;
    static returnRepairItem(data: {
        repair_item_id: string;
        returned_weight: number;
        processing_charge: number;
        return_date: string;
    }): Promise<any>;
}
