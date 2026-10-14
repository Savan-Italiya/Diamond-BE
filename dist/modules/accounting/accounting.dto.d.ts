import { z } from 'zod';
export declare const createPaymentReceiptSchema: z.ZodObject<{
    party_id: z.ZodString;
    amount_received: z.ZodNumber;
    payment_mode: z.ZodEnum<["RTGS", "NEFT", "CHEQUE", "CASH", "UPI", "ANGDIA"]>;
    reference_no: z.ZodOptional<z.ZodString>;
    payment_date: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    allocations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        sales_order_id: z.ZodString;
        allocated_amount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        sales_order_id: string;
        allocated_amount: number;
    }, {
        sales_order_id: string;
        allocated_amount: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    party_id: string;
    amount_received: number;
    payment_date: string;
    payment_mode: "RTGS" | "NEFT" | "CHEQUE" | "CASH" | "UPI" | "ANGDIA";
    reference_no?: string | undefined;
    notes?: string | undefined;
    allocations?: {
        sales_order_id: string;
        allocated_amount: number;
    }[] | undefined;
}, {
    party_id: string;
    amount_received: number;
    payment_date: string;
    payment_mode: "RTGS" | "NEFT" | "CHEQUE" | "CASH" | "UPI" | "ANGDIA";
    reference_no?: string | undefined;
    notes?: string | undefined;
    allocations?: {
        sales_order_id: string;
        allocated_amount: number;
    }[] | undefined;
}>;
export declare const createSupplierPaymentSchema: z.ZodObject<{
    seller_id: z.ZodString;
    amount_paid: z.ZodNumber;
    payment_mode: z.ZodEnum<["RTGS", "NEFT", "CHEQUE", "CASH", "UPI", "ANGDIA"]>;
    reference_no: z.ZodOptional<z.ZodString>;
    payment_date: z.ZodString;
}, "strip", z.ZodTypeAny, {
    seller_id: string;
    payment_date: string;
    payment_mode: "RTGS" | "NEFT" | "CHEQUE" | "CASH" | "UPI" | "ANGDIA";
    amount_paid: number;
    reference_no?: string | undefined;
}, {
    seller_id: string;
    payment_date: string;
    payment_mode: "RTGS" | "NEFT" | "CHEQUE" | "CASH" | "UPI" | "ANGDIA";
    amount_paid: number;
    reference_no?: string | undefined;
}>;
