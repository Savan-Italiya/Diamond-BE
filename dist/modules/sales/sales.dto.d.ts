import { z } from 'zod';
export declare const createSalesOrderSchema: z.ZodObject<{
    buyer_id: z.ZodString;
    broker_id: z.ZodOptional<z.ZodString>;
    invoice_number: z.ZodString;
    discount_pct: z.ZodDefault<z.ZodNumber>;
    payment_due_date: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        lot_id: z.ZodOptional<z.ZodString>;
        single_diamond_id: z.ZodOptional<z.ZodString>;
        carat: z.ZodNumber;
        rate_per_carat: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        carat: number;
        rate_per_carat: number;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }, {
        carat: number;
        rate_per_carat: number;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        carat: number;
        rate_per_carat: number;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }[];
    buyer_id: string;
    invoice_number: string;
    discount_pct: number;
    payment_due_date: string;
    broker_id?: string | undefined;
}, {
    items: {
        carat: number;
        rate_per_carat: number;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }[];
    buyer_id: string;
    invoice_number: string;
    payment_due_date: string;
    broker_id?: string | undefined;
    discount_pct?: number | undefined;
}>;
export declare const createPurchaseOrderSchema: z.ZodObject<{
    seller_id: z.ZodString;
    broker_id: z.ZodOptional<z.ZodString>;
    bill_number: z.ZodString;
    payment_terms_days: z.ZodDefault<z.ZodNumber>;
    order_date: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        lot_id: z.ZodOptional<z.ZodString>;
        single_diamond_id: z.ZodOptional<z.ZodString>;
        carat: z.ZodNumber;
        rate_per_carat: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        carat: number;
        rate_per_carat: number;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }, {
        carat: number;
        rate_per_carat: number;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        carat: number;
        rate_per_carat: number;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }[];
    seller_id: string;
    bill_number: string;
    payment_terms_days: number;
    order_date: string;
    broker_id?: string | undefined;
}, {
    items: {
        carat: number;
        rate_per_carat: number;
        lot_id?: string | undefined;
        single_diamond_id?: string | undefined;
    }[];
    seller_id: string;
    bill_number: string;
    order_date: string;
    broker_id?: string | undefined;
    payment_terms_days?: number | undefined;
}>;
