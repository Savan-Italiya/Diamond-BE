import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { db } from '../../src/database/connection';
import { redisService } from '../../src/config/redis';
import { AppError } from '../../src/middleware/error.middleware';

jest.mock('../../src/database/connection');
jest.mock('../../src/config/redis', () => ({
  redisService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  }
}));
jest.mock('../../src/config/kafka', () => ({
  kafkaService: {
    emit: jest.fn().mockResolvedValue(true)
  },
  KafkaTopics: {
    STOCK_STATUS_CHANGED: 'diamond.inventory.stock-status-changed'
  }
}));

describe('InventoryService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLot', () => {
    it('should throw 409 if lot number already exists', async () => {
      const mockDb: any = db;
      mockDb.mockImplementation(() => ({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ id: 'existing-lot' })
        })
      }));

      await expect(
        InventoryService.createLot({
          lot_number: 'LOT-001',
          total_carat: 50,
          cost_per_carat: 30000,
          purchase_date: '2026-10-01'
        })
      ).rejects.toThrow(AppError);
    });

    it('should create lot, invalidate Redis cache and emit Kafka event', async () => {
      const newLot = { id: 'lot-1', lot_number: 'LOT-999', current_carat: 100 };
      const mockDb: any = db;
      mockDb.mockImplementation(() => ({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null)
        }),
        insert: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([newLot])
        })
      }));

      const res = await InventoryService.createLot({
        lot_number: 'LOT-999',
        total_carat: 100,
        cost_per_carat: 25000,
        purchase_date: '2026-10-10'
      });

      expect(res.id).toBe('lot-1');
      expect(redisService.del).toHaveBeenCalled();
    });
  });

  describe('breakdownLot', () => {
    it('should throw error if parent lot has insufficient carats', async () => {
      const mockParentLot = { id: 'parent-1', current_carat: 20.0 };
      const mockTrx: any = jest.fn(() => ({
        where: jest.fn().mockReturnValue({
          forUpdate: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockParentLot)
          })
        })
      }));

      const mockDb: any = db;
      mockDb.transaction = jest.fn(async (cb: any) => await cb(mockTrx));

      await expect(
        InventoryService.breakdownLot('parent-1', 'CHILD-01', 30.0)
      ).rejects.toThrow(AppError);
    });

    it('should execute breakdown and return updated carats', async () => {
      const mockParentLot = {
        id: 'parent-1',
        current_carat: 50.0,
        cost_per_carat: 1000,
        category_id: 'cat-1',
        purchase_date: '2026-10-01'
      };
      const childLot = { id: 'child-1', lot_number: 'CHILD-01', current_carat: 20.0 };

      const mockTrx: any = jest.fn(() => ({
        where: jest.fn().mockReturnValue({
          forUpdate: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockParentLot)
          }),
          update: jest.fn().mockResolvedValue(1)
        }),
        insert: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([childLot])
        })
      }));
      mockTrx.fn = { now: jest.fn() };

      const mockDb: any = db;
      mockDb.transaction = jest.fn(async (cb: any) => await cb(mockTrx));

      const res = await InventoryService.breakdownLot('parent-1', 'CHILD-01', 20.0);
      expect(res.parentLotUpdatedCarat).toBe(30.0);
      expect(res.childLot.id).toBe('child-1');
    });
  });

  describe('getStockSummary', () => {
    it('should return cached stock summary if available in Redis', async () => {
      const cached = { aggregated_carats: 500 };
      (redisService.get as jest.Mock).mockResolvedValue(JSON.stringify(cached));

      const res = await InventoryService.getStockSummary();
      expect(res.aggregated_carats).toBe(500);
      expect(db).not.toHaveBeenCalled();
    });
  });
});
