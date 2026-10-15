import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../src/modules/auth/auth.controller';
import { AuthService } from '../../src/modules/auth/auth.service';
import { PartiesController } from '../../src/modules/parties/parties.controller';
import { PartiesService } from '../../src/modules/parties/parties.service';
import { InventoryController } from '../../src/modules/inventory/inventory.controller';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { MemoController } from '../../src/modules/memo/memo.controller';
import { MemoService } from '../../src/modules/memo/memo.service';
import { SalesController } from '../../src/modules/sales/sales.controller';
import { SalesService } from '../../src/modules/sales/sales.service';
import { AccountingController } from '../../src/modules/accounting/accounting.controller';
import { AccountingService } from '../../src/modules/accounting/accounting.service';
import { RemindersController } from '../../src/modules/reminders/reminders.controller';
import { RemindersService } from '../../src/modules/reminders/reminders.service';
import { ProcessingController } from '../../src/modules/processing/processing.controller';
import { ProcessingService } from '../../src/modules/processing/processing.service';

describe('Controller Layer Unit Tests', () => {
  let req: any;
  let res: any;
  let next: NextFunction;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {}, headers: {}, user: { userId: 'u-1', roles: ['SUPER_ADMIN'] } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('AuthController', () => {
    it('should handle login and me', async () => {
      jest.spyOn(AuthService, 'login').mockResolvedValue({ token: 'tok', user: { id: '1' } });
      await AuthController.login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      await AuthController.me(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(AuthService, 'register').mockResolvedValue({ id: '2' });
      await AuthController.register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should pass error to next on failure', async () => {
      jest.spyOn(AuthService, 'login').mockRejectedValue(new Error('Auth fail'));
      await AuthController.login(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('PartiesController', () => {
    it('should handle getAll, getById, create, update', async () => {
      jest.spyOn(PartiesService, 'getAllParties').mockResolvedValue([]);
      await PartiesController.getAll(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(PartiesService, 'getPartyById').mockResolvedValue({ id: 'p-1' } as any);
      req.params.id = 'p-1';
      await PartiesController.getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(PartiesService, 'createParty').mockResolvedValue({ id: 'p-new' });
      await PartiesController.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);

      jest.spyOn(PartiesService, 'updateParty').mockResolvedValue({ id: 'p-1' } as any);
      await PartiesController.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should pass error to next on failure', async () => {
      jest.spyOn(PartiesService, 'getAllParties').mockRejectedValue(new Error('fail'));
      await PartiesController.getAll(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(PartiesService, 'getPartyById').mockRejectedValue(new Error('fail'));
      await PartiesController.getById(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(PartiesService, 'createParty').mockRejectedValue(new Error('fail'));
      await PartiesController.create(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(PartiesService, 'updateParty').mockRejectedValue(new Error('fail'));
      await PartiesController.update(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('InventoryController', () => {
    it('should handle getLots, getDiamonds, createLot, createDiamond, breakdown, audit, summary', async () => {
      jest.spyOn(InventoryService, 'getLots').mockResolvedValue([]);
      await InventoryController.getLots(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(InventoryService, 'getSingleDiamonds').mockResolvedValue([]);
      await InventoryController.getSingleDiamonds(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(InventoryService, 'createLot').mockResolvedValue({ id: 'lot-1' } as any);
      await InventoryController.createLot(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);

      jest.spyOn(InventoryService, 'createSingleDiamond').mockResolvedValue({ id: 'd-1' });
      await InventoryController.createSingleDiamond(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);

      jest.spyOn(InventoryService, 'breakdownLot').mockResolvedValue({} as any);
      await InventoryController.breakdownLot(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(InventoryService, 'recordStockAudit').mockResolvedValue({} as any);
      await InventoryController.stockAudit(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);

      jest.spyOn(InventoryService, 'getStockSummary').mockResolvedValue({} as any);
      await InventoryController.getSummary(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should forward errors to next for all inventory methods', async () => {
      jest.spyOn(InventoryService, 'getLots').mockRejectedValue(new Error('fail'));
      await InventoryController.getLots(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(InventoryService, 'getSingleDiamonds').mockRejectedValue(new Error('fail'));
      await InventoryController.getSingleDiamonds(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(InventoryService, 'createLot').mockRejectedValue(new Error('fail'));
      await InventoryController.createLot(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(InventoryService, 'createSingleDiamond').mockRejectedValue(new Error('fail'));
      await InventoryController.createSingleDiamond(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(InventoryService, 'breakdownLot').mockRejectedValue(new Error('fail'));
      await InventoryController.breakdownLot(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(InventoryService, 'recordStockAudit').mockRejectedValue(new Error('fail'));
      await InventoryController.stockAudit(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(InventoryService, 'getStockSummary').mockRejectedValue(new Error('fail'));
      await InventoryController.getSummary(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('MemoController', () => {
    it('should handle getAll, getById, create, returnItem', async () => {
      jest.spyOn(MemoService, 'getAllMemos').mockResolvedValue([]);
      await MemoController.getAll(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(MemoService, 'getMemoById').mockResolvedValue({ id: 'm-1' } as any);
      req.params.id = 'm-1';
      await MemoController.getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(MemoService, 'createMemo').mockResolvedValue({ id: 'm-1' } as any);
      await MemoController.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);

      jest.spyOn(MemoService, 'returnMemoItem').mockResolvedValue({ success: true } as any);
      await MemoController.returnItem(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should forward errors to next for memo methods', async () => {
      jest.spyOn(MemoService, 'getAllMemos').mockRejectedValue(new Error('fail'));
      await MemoController.getAll(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(MemoService, 'getMemoById').mockRejectedValue(new Error('fail'));
      await MemoController.getById(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(MemoService, 'createMemo').mockRejectedValue(new Error('fail'));
      await MemoController.create(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(MemoService, 'returnMemoItem').mockRejectedValue(new Error('fail'));
      await MemoController.returnItem(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('SalesController', () => {
    it('should handle getAll, create, getDebtorsAgeing', async () => {
      jest.spyOn(SalesService, 'getAllSalesOrders').mockResolvedValue([]);
      await SalesController.getAll(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(SalesService, 'createSalesOrder').mockResolvedValue({ id: 'so-1' } as any);
      await SalesController.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);

      jest.spyOn(SalesService, 'getDebtorsAgeingAnalysis').mockResolvedValue({ total_outstanding: 0 } as any);
      await SalesController.getDebtorsAgeing(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should forward errors to next for sales methods', async () => {
      jest.spyOn(SalesService, 'getAllSalesOrders').mockRejectedValue(new Error('fail'));
      await SalesController.getAll(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(SalesService, 'createSalesOrder').mockRejectedValue(new Error('fail'));
      await SalesController.create(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(SalesService, 'getDebtorsAgeingAnalysis').mockRejectedValue(new Error('fail'));
      await SalesController.getDebtorsAgeing(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('AccountingController', () => {
    it('should handle getLedger, recordReceipt, recordSupplierPayment', async () => {
      jest.spyOn(AccountingService, 'getPartyLedger').mockResolvedValue({ party: {}, entries: [] } as any);
      req.params.party_id = 'p-1';
      await AccountingController.getLedger(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(AccountingService, 'recordPaymentReceipt').mockResolvedValue({} as any);
      await AccountingController.recordReceipt(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);

      jest.spyOn(AccountingService, 'recordSupplierPayment').mockResolvedValue({} as any);
      await AccountingController.recordSupplierPayment(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should forward errors to next for accounting methods', async () => {
      jest.spyOn(AccountingService, 'getPartyLedger').mockRejectedValue(new Error('fail'));
      await AccountingController.getLedger(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(AccountingService, 'recordPaymentReceipt').mockRejectedValue(new Error('fail'));
      await AccountingController.recordReceipt(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(AccountingService, 'recordSupplierPayment').mockRejectedValue(new Error('fail'));
      await AccountingController.recordSupplierPayment(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('RemindersController', () => {
    it('should handle getDailyQueue, logFollowUp, updatePromisedDate, triggerDailyJob', async () => {
      jest.spyOn(RemindersService, 'getDailyFollowUpQueue').mockResolvedValue([]);
      await RemindersController.getDailyQueue(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(RemindersService, 'logFollowUp').mockResolvedValue({ id: 'fl-1' } as any);
      await RemindersController.logFollowUp(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);

      jest.spyOn(RemindersService, 'updatePromisedDate').mockResolvedValue({ id: 'ps-1' } as any);
      await RemindersController.updatePromisedDate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(RemindersService, 'runDailyReminderJob').mockResolvedValue(3);
      await RemindersController.triggerDailyJob(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should forward errors to next for reminders methods', async () => {
      jest.spyOn(RemindersService, 'getDailyFollowUpQueue').mockRejectedValue(new Error('fail'));
      await RemindersController.getDailyQueue(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(RemindersService, 'logFollowUp').mockRejectedValue(new Error('fail'));
      await RemindersController.logFollowUp(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(RemindersService, 'updatePromisedDate').mockRejectedValue(new Error('fail'));
      await RemindersController.updatePromisedDate(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(RemindersService, 'runDailyReminderJob').mockRejectedValue(new Error('fail'));
      await RemindersController.triggerDailyJob(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('ProcessingController', () => {
    it('should handle getAll, create, returnItem', async () => {
      jest.spyOn(ProcessingService, 'getAllSlips').mockResolvedValue([]);
      await ProcessingController.getAll(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(ProcessingService, 'createRepairSlip').mockResolvedValue({ id: 'sl-1' } as any);
      await ProcessingController.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);

      jest.spyOn(ProcessingService, 'returnRepairItem').mockResolvedValue({ id: 'ret-1' } as any);
      await ProcessingController.returnItem(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should forward errors to next for processing methods', async () => {
      jest.spyOn(ProcessingService, 'getAllSlips').mockRejectedValue(new Error('fail'));
      await ProcessingController.getAll(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(ProcessingService, 'createRepairSlip').mockRejectedValue(new Error('fail'));
      await ProcessingController.create(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.spyOn(ProcessingService, 'returnRepairItem').mockRejectedValue(new Error('fail'));
      await ProcessingController.returnItem(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
