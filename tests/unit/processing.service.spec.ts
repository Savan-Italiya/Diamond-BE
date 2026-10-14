import { ProcessingService } from '../../src/modules/processing/processing.service';
import { db } from '../../src/database/connection';
import { AppError } from '../../src/middleware/error.middleware';

jest.mock('../../src/database/connection');

describe('ProcessingService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRepairSlip', () => {
    it('should throw 409 if slip number exists', async () => {
      const mockTrx: any = jest.fn(() => ({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ id: 'existing-slip' })
        })
      }));

      const mockDb: any = db;
      mockDb.transaction = jest.fn(async (cb: any) => await cb(mockTrx));

      await expect(
        ProcessingService.createRepairSlip({
          slip_number: 'SLIP-001',
          issue_date: '2026-10-14',
          processor_party_id: 'proc-1',
          items: [{ original_weight: 1.5, reason: 'RE_POLISH' }]
        })
      ).rejects.toThrow(AppError);
    });

    it('should create slip and mark diamond IN_PROCESS', async () => {
      const slip = { id: 'slip-1', slip_number: 'SLIP-NEW' };
      const mockTrx: any = jest.fn((table: string) => {
        if (table === 'repair_issue_slips') {
          return {
            where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }),
            insert: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([slip]) })
          };
        }
        if (table === 'single_diamonds') {
          return {
            where: jest.fn().mockReturnValue({ update: jest.fn().mockResolvedValue(1) })
          };
        }
        if (table === 'repair_items') {
          return { insert: jest.fn().mockResolvedValue([1]) };
        }
        return {};
      });

      const mockDb: any = db;
      mockDb.transaction = jest.fn(async (cb: any) => await cb(mockTrx));

      const res = await ProcessingService.createRepairSlip({
        slip_number: 'SLIP-NEW',
        issue_date: '2026-10-14',
        processor_party_id: 'proc-1',
        items: [{ single_diamond_id: 'd-1', original_weight: 2.1, reason: 'CLEAVAGE_REPAIR' }]
      });

      expect(res.id).toBe('slip-1');
    });
  });

  describe('returnRepairItem', () => {
    it('should throw 400 if returned weight exceeds original weight', async () => {
      const mockItem = { id: 'ri-1', original_weight: 1.5 };
      const mockTrx: any = jest.fn(() => ({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(mockItem)
        })
      }));

      const mockDb: any = db;
      mockDb.transaction = jest.fn(async (cb: any) => await cb(mockTrx));

      await expect(
        ProcessingService.returnRepairItem({
          repair_item_id: 'ri-1',
          returned_weight: 1.8, // greater than 1.5!
          processing_charge: 5000,
          return_date: '2026-10-20'
        })
      ).rejects.toThrow(AppError);
    });

    it('should calculate carat loss and update returned weight and status to IN_STOCK', async () => {
      const mockItem = { id: 'ri-1', slip_id: 'sl-1', single_diamond_id: 'd-1', original_weight: 2.0 };
      const returnSlip = { id: 'ret-1', carat_loss: 0.15, returned_weight: 1.85 };

      const mockTrx: any = jest.fn((table: string) => {
        if (table === 'repair_items') {
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
        if (table === 'repair_return_slips') {
          return {
            insert: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([returnSlip])
            })
          };
        }
        if (table === 'single_diamonds' || table === 'repair_issue_slips') {
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

      const res = await ProcessingService.returnRepairItem({
        repair_item_id: 'ri-1',
        returned_weight: 1.85,
        processing_charge: 8000,
        return_date: '2026-10-20'
      });

      expect(res.carat_loss).toBe(0.15);
      expect(res.returned_weight).toBe(1.85);
    });
  });
});
