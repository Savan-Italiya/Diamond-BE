import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { MemoService } from '../../src/modules/memo/memo.service';
import { PartiesService } from '../../src/modules/parties/parties.service';
import { SalesService } from '../../src/modules/sales/sales.service';
import { db } from '../../src/database/connection';
import { redisService } from '../../src/config/redis';

jest.mock('../../src/database/connection');
jest.mock('../../src/config/redis', () => ({
  redisService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1)
  }
}));
jest.mock('../../src/config/kafka', () => ({
  kafkaService: {
    emit: jest.fn().mockResolvedValue(true)
  },
  KafkaTopics: {
    STOCK_STATUS_CHANGED: 'diamond.inventory.stock-status-changed',
    PAYMENT_DUE_ALERT: 'diamond.accounting.payment-due-alert'
  }
}));

describe('Comprehensive Service Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('InventoryService additional coverage', () => {
    it('should query lots and single diamonds with complex filters', async () => {
      const mockDb: any = db;
      mockDb.mockImplementation((table: string) => {
        if (table === 'diamond_lots') {
          const q: any = {
            leftJoin: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereILike: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockResolvedValue([{ id: 'lot-1' }])
          };
          return q;
        }
        if (table === 'single_diamonds') {
          const q: any = {
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockResolvedValue([{ id: 'd-1', carat: 1.5 }]),
            insert: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([{ id: 'd-new' }])
            })
          };
          return q;
        }
        return {};
      });

      const lots = await InventoryService.getLots({ status: 'IN_STOCK', search: 'BKC' });
      expect(lots).toHaveLength(1);

      const diamonds = await InventoryService.getSingleDiamonds({
        cert_type: 'GIA',
        shape: 'ROUND',
        color: 'D',
        clarity: 'VVS1',
        min_carat: 1.0,
        max_carat: 3.0,
        status: 'IN_STOCK'
      });
      expect(diamonds).toHaveLength(1);

      const createdDiamond = await InventoryService.createSingleDiamond({ carat: 1.5, color: 'D' });
      expect(createdDiamond.id).toBe('d-new');
    });

    it('should record stock audit for single diamond and calculate discrepancy', async () => {
      const mockDb: any = db;
      mockDb.mockImplementation((table: string) => {
        if (table === 'single_diamonds') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue({ id: 'd-1', carat: 2.0 })
            })
          };
        }
        if (table === 'stock_audit_logs') {
          return {
            insert: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([{ id: 'sa-1', physical_carat_found: 1.95, system_carat: 2.0 }])
            })
          };
        }
        return {};
      });

      const audit = await InventoryService.recordStockAudit({
        item_type: 'SINGLE_DIAMOND',
        item_id: 'd-1',
        physical_carat_found: 1.95
      });

      expect(audit.discrepancy).toBeCloseTo(-0.05);
    });

    it('should compute stock valuation when cache is missing', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);
      const mockDb: any = db;
      mockDb.raw = jest.fn((str) => str);
      mockDb.mockImplementation((table: string) => {
        if (table === 'diamond_lots') {
          return {
            where: jest.fn().mockReturnThis(),
            sum: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue({ total_lots: 5, total_carat: 150.0, total_valuation: 4500000 })
            })
          };
        }
        if (table === 'single_diamonds') {
          return {
            where: jest.fn().mockReturnThis(),
            sum: jest.fn().mockReturnThis(),
            count: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue({ total_solitaires: 10, total_carat: 20.0 })
            })
          };
        }
        return {};
      });

      const summary = await InventoryService.getStockSummary();
      expect(summary.aggregated_carats).toBe(170.0);
      expect(redisService.set).toHaveBeenCalled();
    });
  });

  describe('MemoService additional coverage', () => {
    it('should query memos with filters and return by id', async () => {
      const mockMemo = { id: 'm-1', memo_number: 'MEMO-1', party_id: 'p-1' };
      const mockItems = [{ id: 'mi-1', memo_id: 'm-1', carat: 1.5 }];

      const mockDb: any = db;
      mockDb.mockImplementation((table: string) => {
        if (table === 'memo_bills') {
          const q: any = {
            join: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockResolvedValue([mockMemo]),
            first: jest.fn().mockResolvedValue(mockMemo)
          };
          return q;
        }
        if (table === 'memo_items') {
          const q: any = {
            whereIn: jest.fn().mockResolvedValue(mockItems),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue(mockItems)
          };
          return q;
        }
        return {};
      });

      const memos = await MemoService.getAllMemos({ party_id: 'p-1', status: 'OPEN', type: 'MEMO_GIVEN' });
      expect(memos).toHaveLength(1);

      const singleMemo = await MemoService.getMemoById('m-1');
      expect(singleMemo.memo_number).toBe('MEMO-1');
    });

    it('should create memo with lot items and check carat availability', async () => {
      const mockTrx: any = jest.fn((table: string) => {
        if (table === 'memo_bills') {
          return {
            where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }),
            insert: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ id: 'm-lot' }]) })
          };
        }
        if (table === 'diamond_lots') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue({ id: 'lot-1', current_carat: 50.0 })
            })
          };
        }
        if (table === 'memo_items') {
          return { insert: jest.fn().mockResolvedValue([1]) };
        }
        return {};
      });

      const mockDb: any = db;
      mockDb.transaction = jest.fn(async (cb: any) => await cb(mockTrx));

      const res = await MemoService.createMemo({
        memo_number: 'MEMO-LOT-01',
        party_id: 'p-1',
        memo_type: 'MEMO_GIVEN',
        issue_date: '2026-10-14',
        return_due_date: '2026-10-20',
        items: [{ lot_id: 'lot-1', carat: 10.0, asking_price: 30000 }]
      });

      expect(res.id).toBe('m-lot');
    });
  });

  describe('PartiesService updateParty coverage', () => {
    it('should update party, address, and bank details', async () => {
      const party = { id: 'p-1', business_name: 'Original', party_type: 'BROKER' };
      const updatedParty = { id: 'p-1', business_name: 'Updated Name', party_type: 'BROKER' };

      const mockTrx: any = jest.fn((table: string) => ({
        where: jest.fn().mockReturnValue({
          update: jest.fn().mockResolvedValue(1),
          first: jest.fn().mockResolvedValue({ id: 'sub-id' })
        })
      }));
      mockTrx.fn = { now: jest.fn() };

      const mockDb: any = db;
      mockDb.mockImplementation((table: string) => {
        if (table === 'parties') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(party)
            })
          };
        }
        return {
          where: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(null),
            orderBy: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) })
          })
        };
      });
      mockDb.transaction = jest.fn(async (cb: any) => await cb(mockTrx));

      jest.spyOn(PartiesService, 'getPartyById').mockResolvedValue(updatedParty as any);

      const res = await PartiesService.updateParty('p-1', {
        business_name: 'Updated Name',
        address: { address_line: 'New Street', city: 'Mumbai', pincode: '400004' },
        bank_details: { bank_name: 'ICICI', account_no: '999', ifsc: 'ICIC001' },
        default_commission_rate: 2.0
      });

      expect(res.business_name).toBe('Updated Name');
    });
  });

  describe('SalesService additional coverage', () => {
    it('should create sales order with parcel lots and update lot carats', async () => {
      const order = { id: 'so-lot', invoice_number: 'INV-LOT-1', net_amount: 100000 };
      const mockLot = { id: 'lot-1', current_carat: 20.0, status: 'IN_STOCK' };

      const mockTrx: any = jest.fn((table: string) => {
        if (table === 'sales_orders') {
          return {
            where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }),
            insert: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([order]) })
          };
        }
        if (table === 'diamond_lots') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(mockLot),
              update: jest.fn().mockResolvedValue(1)
            })
          };
        }
        if (table === 'sales_items' || table === 'party_ledgers' || table === 'payment_schedules') {
          return {
            insert: jest.fn().mockResolvedValue([1]),
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) })
            })
          };
        }
        return {};
      });

      const mockDb: any = db;
      mockDb.transaction = jest.fn(async (cb: any) => await cb(mockTrx));

      const res = await SalesService.createSalesOrder({
        buyer_id: 'b-1',
        invoice_number: 'INV-LOT-1',
        discount_pct: 0,
        payment_due_date: '2026-11-01',
        items: [{ lot_id: 'lot-1', carat: 5.0, rate_per_carat: 20000 }]
      });

      expect(res.id).toBe('so-lot');
    });

    it('should query sales orders with buyer and status filters', async () => {
      const mockDb: any = db;
      mockDb.mockImplementation((table: string) => {
        if (table === 'sales_orders') {
          const q: any = {
            join: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockResolvedValue([{ id: 'so-1', invoice_number: 'INV-1' }])
          };
          return q;
        }
        if (table === 'sales_items') {
          return {
            whereIn: jest.fn().mockResolvedValue([{ id: 'si-1', sales_id: 'so-1' }])
          };
        }
        return {};
      });

      const orders = await SalesService.getAllSalesOrders({ buyer_id: 'b-1', deal_status: 'UNPAID' });
      expect(orders).toHaveLength(1);
      expect(orders[0].items).toHaveLength(1);
    });
  });
});
