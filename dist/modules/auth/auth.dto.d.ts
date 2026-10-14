import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
}, {
    password: string;
    email: string;
}>;
export declare const registerUserSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    roleNames: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    phone: string;
    name: string;
    roleNames: string[];
}, {
    password: string;
    email: string;
    phone: string;
    name: string;
    roleNames?: string[] | undefined;
}>;
