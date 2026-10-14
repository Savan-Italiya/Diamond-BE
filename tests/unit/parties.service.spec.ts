import { PartiesService } from '../../src/modules/parties/parties.service';
import { db } from '../../src/database/connection';
import { AppError } from '../../src/middleware/error.middleware';

jest.mock('../../src/database/connection');

describe('PartiesService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get all parties and attach latest ledger balances', async () => {
    const mockParties = [
      { id: 'p-1', business_name: 'Mahavir Gems', owner_name: 'Bipin', party_type: 'BUYER' }
    ];

    const mockDb: any = db;
    mockDb.mockImplementation((tableName: string) => {
      if (tableName === 'parties') {
        return {
          select: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            whereILike: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockResolvedValue(mockParties)
          })
        };
      }
      if (tableName === 'party_ledgers') {
        return {
          whereIn: jest.fn().mockReturnThis(),
          distinctOn: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue([{ party_id: 'p-1', running_balance: 150000.0 }])
        };
      }
      return {};
    });

    const result = await PartiesService.getAllParties();
    expect(result).toHaveLength(1);
    expect(result[0].current_balance).toBe(150000.0);
  });

  it('should throw 404 if party is not found', async () => {
    const mockDb: any = db;
    mockDb.mockImplementation(() => ({
      where: jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue(null)
      })
    }));

    await expect(PartiesService.getPartyById('non-existent')).rejects.toThrow(AppError);
  });

  it('should create party with address, bank details and broker record in transaction', async () => {
    const createdParty = { id: 'p-new', business_name: 'Opera Brokerage', party_type: 'BROKER' };
    const mockTrx: any = jest.fn((table: string) => ({
      insert: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([createdParty])
      })
    }));

    const mockDb: any = db;
    mockDb.transaction = jest.fn(async (cb: any) => await cb(mockTrx));

    const result = await PartiesService.createParty({
      business_name: 'Opera Brokerage',
      owner_name: 'Nilesh',
      phone_primary: '+919820555555',
      party_type: 'BROKER',
      address: { address_line: 'Opera House', pincode: '400004' },
      bank_details: { bank_name: 'HDFC', account_no: '1234', ifsc: 'HDFC0001' },
      default_commission_rate: 1.5
    });

    expect(result.id).toBe('p-new');
  });
});
