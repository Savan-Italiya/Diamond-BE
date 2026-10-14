import { z } from 'zod';
export declare const createPartySchema: z.ZodObject<{
    business_name: z.ZodString;
    owner_name: z.ZodString;
    phone_primary: z.ZodString;
    phone_secondary: z.ZodOptional<z.ZodString>;
    gstin: z.ZodOptional<z.ZodString>;
    pan: z.ZodOptional<z.ZodString>;
    party_type: z.ZodEnum<["BUYER", "SELLER", "BROKER", "PROCESSOR"]>;
    credit_limit: z.ZodDefault<z.ZodNumber>;
    address: z.ZodOptional<z.ZodObject<{
        address_line: z.ZodString;
        city: z.ZodDefault<z.ZodString>;
        state: z.ZodDefault<z.ZodString>;
        pincode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        address_line: string;
        city: string;
        state: string;
        pincode: string;
    }, {
        address_line: string;
        pincode: string;
        city?: string | undefined;
        state?: string | undefined;
    }>>;
    bank_details: z.ZodOptional<z.ZodObject<{
        bank_name: z.ZodString;
        account_no: z.ZodString;
        ifsc: z.ZodString;
        upi_id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        bank_name: string;
        account_no: string;
        ifsc: string;
        upi_id?: string | undefined;
    }, {
        bank_name: string;
        account_no: string;
        ifsc: string;
        upi_id?: string | undefined;
    }>>;
    default_commission_rate: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    party_type: "BUYER" | "SELLER" | "BROKER" | "PROCESSOR";
    business_name: string;
    phone_primary: string;
    owner_name: string;
    credit_limit: number;
    address?: {
        address_line: string;
        city: string;
        state: string;
        pincode: string;
    } | undefined;
    bank_details?: {
        bank_name: string;
        account_no: string;
        ifsc: string;
        upi_id?: string | undefined;
    } | undefined;
    default_commission_rate?: number | undefined;
    phone_secondary?: string | undefined;
    gstin?: string | undefined;
    pan?: string | undefined;
}, {
    party_type: "BUYER" | "SELLER" | "BROKER" | "PROCESSOR";
    business_name: string;
    phone_primary: string;
    owner_name: string;
    address?: {
        address_line: string;
        pincode: string;
        city?: string | undefined;
        state?: string | undefined;
    } | undefined;
    bank_details?: {
        bank_name: string;
        account_no: string;
        ifsc: string;
        upi_id?: string | undefined;
    } | undefined;
    default_commission_rate?: number | undefined;
    phone_secondary?: string | undefined;
    gstin?: string | undefined;
    pan?: string | undefined;
    credit_limit?: number | undefined;
}>;
export declare const updatePartySchema: z.ZodObject<{
    business_name: z.ZodOptional<z.ZodString>;
    owner_name: z.ZodOptional<z.ZodString>;
    phone_primary: z.ZodOptional<z.ZodString>;
    phone_secondary: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    gstin: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    pan: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    party_type: z.ZodOptional<z.ZodEnum<["BUYER", "SELLER", "BROKER", "PROCESSOR"]>>;
    credit_limit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        address_line: z.ZodString;
        city: z.ZodDefault<z.ZodString>;
        state: z.ZodDefault<z.ZodString>;
        pincode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        address_line: string;
        city: string;
        state: string;
        pincode: string;
    }, {
        address_line: string;
        pincode: string;
        city?: string | undefined;
        state?: string | undefined;
    }>>>;
    bank_details: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        bank_name: z.ZodString;
        account_no: z.ZodString;
        ifsc: z.ZodString;
        upi_id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        bank_name: string;
        account_no: string;
        ifsc: string;
        upi_id?: string | undefined;
    }, {
        bank_name: string;
        account_no: string;
        ifsc: string;
        upi_id?: string | undefined;
    }>>>;
    default_commission_rate: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    party_type?: "BUYER" | "SELLER" | "BROKER" | "PROCESSOR" | undefined;
    business_name?: string | undefined;
    address?: {
        address_line: string;
        city: string;
        state: string;
        pincode: string;
    } | undefined;
    bank_details?: {
        bank_name: string;
        account_no: string;
        ifsc: string;
        upi_id?: string | undefined;
    } | undefined;
    default_commission_rate?: number | undefined;
    phone_primary?: string | undefined;
    owner_name?: string | undefined;
    phone_secondary?: string | undefined;
    gstin?: string | undefined;
    pan?: string | undefined;
    credit_limit?: number | undefined;
}, {
    party_type?: "BUYER" | "SELLER" | "BROKER" | "PROCESSOR" | undefined;
    business_name?: string | undefined;
    address?: {
        address_line: string;
        pincode: string;
        city?: string | undefined;
        state?: string | undefined;
    } | undefined;
    bank_details?: {
        bank_name: string;
        account_no: string;
        ifsc: string;
        upi_id?: string | undefined;
    } | undefined;
    default_commission_rate?: number | undefined;
    phone_primary?: string | undefined;
    owner_name?: string | undefined;
    phone_secondary?: string | undefined;
    gstin?: string | undefined;
    pan?: string | undefined;
    credit_limit?: number | undefined;
}>;
