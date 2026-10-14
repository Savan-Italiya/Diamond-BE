import { AccountingService } from '../../src/modules/accounting/accounting.service';
import { db } from '../../src/database/connection';
import { AppError } from '../../src/middleware/error.middleware';

jest.mock('../../src/database/connection');
jest.mock('../../src/config/kafka', () => ({
  kafkaService: {
    emit: jest.fn().mockResolvedValue(true)
  },
  KafkaTopics: {
    PAYMENT_RECEIVED: 'diamond.accounting.payment-received'
  }
}));

describe('AccountingService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPartyLedger', () => {
    it('should throw 404 if party is not found', async () => {
      const mockDb: any = db;
      mockDb.mockImplementation(() => ({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null)
        })
      }));

      await expect(AccountingService.getPartyLedger('non-existent')).rejects.toThrow(AppError);
    });

    it('should calculate party running balance from ledger entries', async () => {
      const mockParty = { id: 'p-1', business_name: 'Shreeji Gems', owner_name: 'Dinesh', party_type: 'BUYER' };
      const mockEntries = [
        { id: 'l-1', entry_type: 'DEBIT', amount: 100000, running_balance: 100000 },
        { id: 'l-2', entry_type: 'CREDIT', amount: 40000, running_balance: 60000 }
      ];

      const mockDb: any = db;
      mockDb.mockImplementation((tableName: string) => {
        if (tableName === 'parties') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(mockParty)
            })
          };
        }
        if (tableName === 'party_ledgers') {
          return {
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockResolvedValue(mockEntries)
          };
        }
        return {};
      });

      const res = await AccountingService.getPartyLedger('p-1');
      expect(res.party.current_running_balance).toBe(60000);
      expect(res.entries).toHaveLength(2);
    });
  });

  describe('recordPaymentReceipt', () => {
    it('should record receipt, credit party ledger and settle allocated sales invoice', async () => {
      const receipt = { id: 'rcpt-1', amount_received: 50000 };
      const mockOrder = { id: 'so-1', net_amount: 50000 };

      const mockTrx: any = jest.fn((table: string) => {
        if (table === 'payment_receipts') {
          return {
            insert: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([receipt])
            })
          };
        }
        if (table === 'party_ledgers') {
          return {
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                first: jest.fn().mockResolvedValue({ running_balance: 80000 })
              })
            }),
            insert: jest.fn().mockResolvedValue([1])
          };
        }
        if (table === 'payment_allocations') {
          return {
            insert: jest.fn().mockResolvedValue([1]),
            where: jest.fn().mockReturnValue({
              sum: jest.fn().mockReturnValue({
                first: jest.fn().mockResolvedValue({ sum: 50000 })
              })
            })
          };
        }
        if (table === 'sales_orders') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(mockOrder),
              update: jest.fn().mockResolvedValue(1)
            })
          };
        }
        if (table === 'payment_schedules') {
          return {
            where: jest.fn().mockReturnValue({
              update: jest.fn().mockResolvedValue(1)
            })
          };
        }
        return {};
      });

      const mockDb: any = db;
      mockDb.transaction = jest.fn(async (cb: any) => await cb(mockTrx));

      const res = await AccountingService.recordPaymentReceipt({
        party_id: 'p-1',
        amount_received: 50000,
        payment_mode: 'RTGS',
        payment_date: '2026-10-14',
        allocations: [{ sales_order_id: 'so-1', allocated_amount: 50000 }]
      });

      expect(res.receipt.id).toBe('rcpt-1');
      expect(res.new_balance).toBe(30000); // 80000 - 50000
    });
  });

  describe('recordSupplierPayment', () => {
    it('should record payment to seller and debit ledger', async () => {
      const payment = { id: 'sp-1', amount_paid: 20000 };
      const mockTrx: any = jest.fn((table: string) => {
        if (table === 'supplier_payments') {
          return {
            insert: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([payment])
            })
          };
        }
        if (table === 'party_ledgers') {
          return {
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                first: jest.fn().mockResolvedValue({ running_balance: -50000 })
              })
            }),
            insert: jest.fn().mockResolvedValue([1])
          };
        }
        return {};
      });

      const mockDb: any = db;
      mockDb.transaction = jest.fn(async (cb: any) => await cb(mockTrx));

      const res = await AccountingService.recordSupplierPayment({
        seller_id: 'seller-1',
        amount_paid: 20000,
        payment_mode: 'NEFT',
        payment_date: '2026-10-14'
      });

      expect(res.payment.id).toBe('sp-1');
      expect(res.new_balance).toBe(-30000);
    });
  });
});
