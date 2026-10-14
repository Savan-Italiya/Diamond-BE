export declare class InventoryService {
    static getLots(filters?: {
        status?: string;
        search?: string;
    }): Promise<any[]>;
    static getSingleDiamonds(filters?: {
        cert_type?: string;
        shape?: string;
        color?: string;
        clarity?: string;
        min_carat?: number;
        max_carat?: number;
        status?: string;
    }): Promise<any[]>;
    static createLot(data: {
        lot_number: string;
        category_id?: string;
        total_carat: number;
        cost_per_carat: number;
        purchase_date: string;
    }): Promise<any>;
    static createSingleDiamond(data: any): Promise<any>;
    static breakdownLot(parentLotId: string, newLotNumber: string, caratsTransferred: number, costPerCarat?: number): Promise<{
        parentLotUpdatedCarat: number;
        childLot: any;
    }>;
    static recordStockAudit(data: {
        item_type: 'LOT' | 'SINGLE_DIAMOND';
        item_id: string;
        physical_carat_found: number;
        checked_by?: string;
        remarks?: string;
    }): Promise<any>;
    static getStockSummary(): Promise<any>;
}
