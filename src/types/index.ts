import { Request } from 'express';

export interface UserPayload {
  userId: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  organization_id?: string | null;
  user_scope?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export enum PartyType {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  BROKER = 'BROKER',
  PROCESSOR = 'PROCESSOR'
}

export enum DiamondStatus {
  IN_STOCK = 'IN_STOCK',
  SOLD = 'SOLD',
  IN_PROCESS = 'IN_PROCESS',
  MEMO = 'MEMO'
}

export enum MemoType {
  MEMO_GIVEN = 'MEMO_GIVEN',
  MEMO_RECEIVED = 'MEMO_RECEIVED'
}

export enum MemoStatus {
  OPEN = 'OPEN',
  PARTIAL_RETURN = 'PARTIAL_RETURN',
  CLOSED = 'CLOSED',
  CONVERTED_TO_SALE = 'CONVERTED_TO_SALE'
}

export enum DealStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  SETTLED = 'SETTLED',
  CANCELLED = 'CANCELLED'
}

export enum LedgerEntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT'
}
