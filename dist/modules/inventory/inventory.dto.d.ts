import { z } from 'zod';
export declare const createLotSchema: z.ZodObject<{
    lot_number: z.ZodString;
    category_id: z.ZodOptional<z.ZodString>;
    total_carat: z.ZodNumber;
    cost_per_carat: z.ZodNumber;
    purchase_date: z.ZodString;
}, "strip", z.ZodTypeAny, {
    lot_number: string;
    total_carat: number;
    cost_per_carat: number;
    purchase_date: string;
    category_id?: string | undefined;
}, {
    lot_number: string;
    total_carat: number;
    cost_per_carat: number;
    purchase_date: string;
    category_id?: string | undefined;
}>;
export declare const createSingleDiamondSchema: z.ZodObject<{
    lot_id: z.ZodOptional<z.ZodString>;
    cert_type: z.ZodDefault<z.ZodEnum<["GIA", "IGI", "HRD", "NON_CERT"]>>;
    cert_number: z.ZodOptional<z.ZodString>;
    shape: z.ZodDefault<z.ZodEnum<["ROUND", "PEAR", "MARQUISE", "PRINCESS", "EMERALD", "OVAL", "CUSHION", "RADIANT", "HEART"]>>;
    carat: z.ZodNumber;
    color: z.ZodString;
    clarity: z.ZodString;
    cut: z.ZodOptional<z.ZodString>;
    polish: z.ZodOptional<z.ZodString>;
    symmetry: z.ZodOptional<z.ZodString>;
    fluorescence: z.ZodOptional<z.ZodString>;
    lab_video_url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    shape: "ROUND" | "PEAR" | "MARQUISE" | "PRINCESS" | "EMERALD" | "OVAL" | "CUSHION" | "RADIANT" | "HEART";
    cert_type: "GIA" | "IGI" | "HRD" | "NON_CERT";
    color: string;
    clarity: string;
    carat: number;
    lot_id?: string | undefined;
    cert_number?: string | undefined;
    cut?: string | undefined;
    polish?: string | undefined;
    symmetry?: string | undefined;
    fluorescence?: string | undefined;
    lab_video_url?: string | undefined;
}, {
    color: string;
    clarity: string;
    carat: number;
    shape?: "ROUND" | "PEAR" | "MARQUISE" | "PRINCESS" | "EMERALD" | "OVAL" | "CUSHION" | "RADIANT" | "HEART" | undefined;
    cert_type?: "GIA" | "IGI" | "HRD" | "NON_CERT" | undefined;
    lot_id?: string | undefined;
    cert_number?: string | undefined;
    cut?: string | undefined;
    polish?: string | undefined;
    symmetry?: string | undefined;
    fluorescence?: string | undefined;
    lab_video_url?: string | undefined;
}>;
export declare const lotBreakdownSchema: z.ZodObject<{
    parent_lot_id: z.ZodString;
    new_lot_number: z.ZodString;
    carats_transferred: z.ZodNumber;
    cost_per_carat: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    parent_lot_id: string;
    new_lot_number: string;
    carats_transferred: number;
    cost_per_carat?: number | undefined;
}, {
    parent_lot_id: string;
    new_lot_number: string;
    carats_transferred: number;
    cost_per_carat?: number | undefined;
}>;
export declare const stockAuditSchema: z.ZodObject<{
    item_type: z.ZodEnum<["LOT", "SINGLE_DIAMOND"]>;
    item_id: z.ZodString;
    physical_carat_found: z.ZodNumber;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    item_type: "LOT" | "SINGLE_DIAMOND";
    item_id: string;
    physical_carat_found: number;
    remarks?: string | undefined;
}, {
    item_type: "LOT" | "SINGLE_DIAMOND";
    item_id: string;
    physical_carat_found: number;
    remarks?: string | undefined;
}>;
