import { z } from 'zod';
export declare const createRepairSlipSchema: z.ZodObject<{
    slip_number: z.ZodString;
    issue_date: z.ZodString;
    processor_party_id: z.ZodString;
    expected_return_date: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        lot_id: z.ZodOptional<z.ZodString>;
        single_diamond_id: z.ZodOptional<z.ZodString>;
        original_weight: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        original_weight: number;
        reason: string;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }, {
        original_weight: number;
        reason: string;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    issue_date: string;
    items: {
        original_weight: number;
        reason: string;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }[];
    processor_party_id: string;
    slip_number: string;
    expected_return_date?: string | undefined;
}, {
    issue_date: string;
    items: {
        original_weight: number;
        reason: string;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }[];
    processor_party_id: string;
    slip_number: string;
    expected_return_date?: string | undefined;
}>;
export declare const returnRepairSlipSchema: z.ZodObject<{
    repair_item_id: z.ZodString;
    returned_weight: z.ZodNumber;
    processing_charge: z.ZodDefault<z.ZodNumber>;
    return_date: z.ZodString;
}, "strip", z.ZodTypeAny, {
    repair_item_id: string;
    returned_weight: number;
    processing_charge: number;
    return_date: string;
}, {
    repair_item_id: string;
    returned_weight: number;
    return_date: string;
    processing_charge?: number | undefined;
}>;
