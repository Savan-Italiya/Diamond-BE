import { z } from 'zod';
export declare const createMemoBillSchema: z.ZodObject<{
    memo_number: z.ZodString;
    party_id: z.ZodString;
    broker_id: z.ZodOptional<z.ZodString>;
    memo_type: z.ZodEnum<["MEMO_GIVEN", "MEMO_RECEIVED"]>;
    issue_date: z.ZodString;
    return_due_date: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        lot_id: z.ZodOptional<z.ZodString>;
        single_diamond_id: z.ZodOptional<z.ZodString>;
        carat: z.ZodNumber;
        asking_price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        carat: number;
        asking_price: number;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }, {
        carat: number;
        asking_price: number;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    party_id: string;
    memo_number: string;
    memo_type: "MEMO_GIVEN" | "MEMO_RECEIVED";
    issue_date: string;
    return_due_date: string;
    items: {
        carat: number;
        asking_price: number;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }[];
    broker_id?: string | undefined;
}, {
    party_id: string;
    memo_number: string;
    memo_type: "MEMO_GIVEN" | "MEMO_RECEIVED";
    issue_date: string;
    return_due_date: string;
    items: {
        carat: number;
        asking_price: number;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }[];
    broker_id?: string | undefined;
}>;
export declare const returnMemoItemSchema: z.ZodObject<{
    memo_item_id: z.ZodString;
    returned_carat: z.ZodNumber;
    condition_notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    memo_item_id: string;
    returned_carat: number;
    condition_notes?: string | undefined;
}, {
    memo_item_id: string;
    returned_carat: number;
    condition_notes?: string | undefined;
}>;
