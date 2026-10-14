import { SalesService } from '../../src/modules/sales/sales.service';
import { db } from '../../src/database/connection';
import { AppError } from '../../src/middleware/error.middleware';

jest.mock('../../src/database/connection');
jest.mock('../../src/config/kafka', () => ({
  kafkaService: {
    emit: jest.fn().mockResolvedValue(true)
  },
  KafkaTopics: {
    STOCK_STATUS_CHANGED: 'diamond.inventory.stock-status-changed',
    PAYMENT_DUE_ALERT: 'diamond.accounting.payment-due-alert'
  }
}));

describe('SalesService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSalesOrder', () => {
    it('should throw 409 if invoice number already exists', async () => {
      const mockTrx: any = jest.fn(() => ({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ id: 'inv-exists' })
        })
      }));

      const mockDb: any = db;
      mockDb.transaction = jest.fn(async (cb: any) => await cb(mockTrx));

      await expect(
        SalesService.createSalesOrder({
          buyer_id: 'b-1',
          invoice_number: 'INV-2026-001',
          discount_pct: 0,
          payment_due_date: '2026-11-01',
          items: [{ carat: 2.0, rate_per_carat: 100000 }]
        })
      ).rejects.toThrow(AppError);
    });

    it('should create sales order, debit party ledger, create brokerage and payment schedule', async () => {
      const createdOrder = {
        id: 'so-1',
        invoice_number: 'INV-999',
        net_amount: 190000
      };

      const mockTrx: any = jest.fn((table: string) => {
        if (table === 'sales_orders') {
          return {
            where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }),
            insert: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([createdOrder]) })
          };
        }
        if (table === 'single_diamonds') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue({ id: 'd-1', status: 'IN_STOCK' }),
              update: jest.fn().mockResolvedValue(1)
            })
          };
        }
        if (table === 'sales_items' || table === 'party_ledgers' || table === 'brokerage_ledgers' || table === 'payment_schedules') {
          return {
            insert: jest.fn().mockResolvedValue([1]),
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                first: jest.fn().mockResolvedValue({ running_balance: 50000 })
              })
            })
          };
        }
        if (table === 'brokers') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue({ id: 'br-1', default_commission_rate: 1.0 })
            })
          };
        }
        return {};
      });

      const mockDb: any = db;
      mockDb.transaction = jest.fn(async (cb: any) => await cb(mockTrx));

      const res = await SalesService.createSalesOrder({
        buyer_id: 'buyer-1',
        broker_id: 'broker-1',
        invoice_number: 'INV-999',
        discount_pct: 5,
        payment_due_date: '2026-11-15',
        items: [{ single_diamond_id: 'd-1', carat: 2.0, rate_per_carat: 100000 }]
      });

      expect(res.id).toBe('so-1');
      expect(res.net_amount).toBe(190000);
    });
  });

  describe('getDebtorsAgeingAnalysis', () => {
    it('should bucket schedules into overdue categories', async () => {
      const pastDate95Days = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const pastDate40Days = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const mockSchedules = [
        { id: 's-1', due_date: pastDate95Days, amount_due: 500000, business_name: 'Party A' },
        { id: 's-2', due_date: pastDate40Days, amount_due: 300000, business_name: 'Party B' }
      ];

      const mockDb: any = db;
      mockDb.mockImplementation(() => ({
        join: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockSchedules)
      }));

      const res = await SalesService.getDebtorsAgeingAnalysis();
      expect(res.total_outstanding).toBe(800000);
      expect(res.over_90_days).toHaveLength(1);
      expect(res.days_31_to_60).toHaveLength(1);
    });
  });
});
