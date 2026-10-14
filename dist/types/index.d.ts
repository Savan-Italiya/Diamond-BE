import { Request } from 'express';
export interface UserPayload {
    userId: string;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
}
export interface AuthenticatedRequest extends Request {
    user?: UserPayload;
}
export declare enum PartyType {
    BUYER = "BUYER",
    SELLER = "SELLER",
    BROKER = "BROKER",
    PROCESSOR = "PROCESSOR"
}
export declare enum DiamondStatus {
    IN_STOCK = "IN_STOCK",
    SOLD = "SOLD",
    IN_PROCESS = "IN_PROCESS",
    MEMO = "MEMO"
}
export declare enum MemoType {
    MEMO_GIVEN = "MEMO_GIVEN",
    MEMO_RECEIVED = "MEMO_RECEIVED"
}
export declare enum MemoStatus {
    OPEN = "OPEN",
    PARTIAL_RETURN = "PARTIAL_RETURN",
    CLOSED = "CLOSED",
    CONVERTED_TO_SALE = "CONVERTED_TO_SALE"
}
export declare enum DealStatus {
    UNPAID = "UNPAID",
    PARTIAL = "PARTIAL",
    SETTLED = "SETTLED",
    CANCELLED = "CANCELLED"
}
export declare enum LedgerEntryType {
    DEBIT = "DEBIT",
    CREDIT = "CREDIT"
}
