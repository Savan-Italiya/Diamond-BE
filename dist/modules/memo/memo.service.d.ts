export declare class MemoService {
    static getAllMemos(filters?: {
        party_id?: string;
        status?: string;
        type?: string;
    }): Promise<any[]>;
    static getMemoById(id: string): Promise<any>;
    static createMemo(data: {
        memo_number: string;
        party_id: string;
        broker_id?: string;
        memo_type: 'MEMO_GIVEN' | 'MEMO_RECEIVED';
        issue_date: string;
        return_due_date: string;
        items: Array<{
            lot_id?: string;
            single_diamond_id?: string;
            carat: number;
            asking_price: number;
        }>;
    }): Promise<any>;
    static returnMemoItem(memoItemId: string, returnedCarat: number, receivedByUserId?: string, conditionNotes?: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
