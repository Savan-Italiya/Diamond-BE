import { MemoService } from '../../src/modules/memo/memo.service';
import { db } from '../../src/database/connection';
import { AppError } from '../../src/middleware/error.middleware';

jest.mock('../../src/database/connection');
jest.mock('../../src/config/kafka', () => ({
  kafkaService: {
    emit: jest.fn().mockResolvedValue(true)
  },
  KafkaTopics: {
    STOCK_STATUS_CHANGED: 'diamond.inventory.stock-status-changed'
  }
}));

describe('MemoService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMemo', () => {
    it('should throw error if diamond is already on memo or sold', async () => {
      const mockTrx: any = jest.fn((table: string) => {
        if (table === 'memo_bills') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(null)
            }),
            insert: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([{ id: 'memo-1', memo_number: 'M-1' }])
            })
          };
        }
        if (table === 'single_diamonds') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue({ id: 'd-1', status: 'MEMO' }) // already on memo!
            })
          };
        }
        return {};
      });

      const mockDb: any = db;
      mockDb.transaction = jest.fn(async (cb: any) => await cb(mockTrx));

      await expect(
        MemoService.createMemo({
          memo_number: 'M-1',
          party_id: 'party-1',
          memo_type: 'MEMO_GIVEN',
          issue_date: '2026-10-14',
          return_due_date: '2026-10-21',
          items: [{ single_diamond_id: 'd-1', carat: 1.5, asking_price: 300000 }]
        })
      ).rejects.toThrow(AppError);
    });

    it('should successfully issue memo and set diamond status to MEMO', async () => {
      const mockTrx: any = jest.fn((table: string) => {
        if (table === 'memo_bills') {
          return {
            where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }),
            insert: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([{ id: 'm-1', memo_number: 'MEMO-001' }])
            })
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
        if (table === 'memo_items') {
          return {
            insert: jest.fn().mockResolvedValue([1])
          };
        }
        return {};
      });

      const mockDb: any = db;
      mockDb.transaction = jest.fn(async (cb: any) => await cb(mockTrx));

      const res = await MemoService.createMemo({
        memo_number: 'MEMO-001',
        party_id: 'p-1',
        memo_type: 'MEMO_GIVEN',
        issue_date: '2026-10-14',
        return_due_date: '2026-10-21',
        items: [{ single_diamond_id: 'd-1', carat: 1.5, asking_price: 350000 }]
      });

      expect(res.id).toBe('m-1');
    });
  });

  describe('returnMemoItem', () => {
    it('should return memo item and set memo status to CLOSED if no items remain', async () => {
      const mockItem = { id: 'mi-1', memo_id: 'm-1', single_diamond_id: 'd-1', status: 'WITH_PARTY' };
      const mockTrx: any = jest.fn((table: string) => {
        if (table === 'memo_items') {
          return {
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(mockItem),
              update: jest.fn().mockResolvedValue(1),
              count: jest.fn().mockReturnValue({
                first: jest.fn().mockResolvedValue({ count: '0' })
              })
            })
          };
        }
        if (table === 'memo_return_logs') {
          return { insert: jest.fn().mockResolvedValue([1]) };
        }
        if (table === 'single_diamonds') {
          return {
            where: jest.fn().mockReturnValue({
              update: jest.fn().mockResolvedValue(1)
            })
          };
        }
        if (table === 'memo_bills') {
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

      const res = await MemoService.returnMemoItem('mi-1', 1.5, 'user-1', 'Good condition');
      expect(res.success).toBe(true);
    });
  });
});
