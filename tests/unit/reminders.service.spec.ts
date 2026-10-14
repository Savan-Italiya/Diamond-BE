import { RemindersService } from '../../src/modules/reminders/reminders.service';
import { db } from '../../src/database/connection';
import { redisService } from '../../src/config/redis';

jest.mock('../../src/database/connection');
jest.mock('../../src/config/redis', () => ({
  redisService: {
    set: jest.fn().mockResolvedValue('OK')
  }
}));
jest.mock('../../src/config/kafka', () => ({
  kafkaService: {
    emit: jest.fn().mockResolvedValue(true)
  },
  KafkaTopics: {
    DAILY_REMINDER_TRIGGER: 'diamond.reminders.daily-trigger'
  }
}));

describe('RemindersService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDailyFollowUpQueue', () => {
    it('should generate WhatsApp deep-link and tel: link for overdue payments', async () => {
      const mockOverdue = [
        {
          schedule_id: 'sch-1',
          due_date: '2026-10-10',
          amount_due: 750000,
          status: 'OVERDUE',
          party_id: 'p-1',
          business_name: 'Navratna Gems',
          owner_name: 'Kamleshbhai',
          phone_primary: '+919820112233',
          invoice_number: 'INV-101'
        }
      ];

      const mockDb: any = db;
      mockDb.mockImplementation(() => ({
        join: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockOverdue)
        })
      }));

      const queue = await RemindersService.getDailyFollowUpQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].one_tap_dial_url).toBe('tel:+919820112233');
      expect(queue[0].whatsapp_app_url).toContain('whatsapp://send?phone=919820112233');
      expect(queue[0].whatsapp_web_url).toContain('https://api.whatsapp.com/send?phone=919820112233');
    });
  });

  describe('logFollowUp', () => {
    it('should insert follow-up log with audio note URL', async () => {
      const mockLog = { id: 'log-1', client_response: 'Will pay by Friday', audio_note_url: 'https://cdn/voice.m4a' };
      const mockDb: any = db;
      mockDb.mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockLog])
        })
      }));

      const res = await RemindersService.logFollowUp({
        party_id: 'p-1',
        call_date: '2026-10-14',
        client_response: 'Will pay by Friday',
        audio_note_url: 'https://cdn/voice.m4a'
      });

      expect(res.id).toBe('log-1');
      expect(res.audio_note_url).toBe('https://cdn/voice.m4a');
    });
  });

  describe('runDailyReminderJob', () => {
    it('should trigger reminders and cache queue in Redis', async () => {
      jest.spyOn(RemindersService, 'getDailyFollowUpQueue').mockResolvedValue([
        {
          schedule_id: 'sch-1',
          due_date: '2026-10-14',
          amount_due: 100000,
          status: 'PENDING',
          party_id: 'p-1',
          business_name: 'Kothari',
          owner_name: 'Pravin',
          phone_primary: '+919820000000',
          invoice_number: 'INV-1',
          one_tap_dial_url: 'tel:+919820000000',
          whatsapp_app_url: 'whatsapp://...',
          whatsapp_web_url: 'https://...'
        }
      ]);

      const mockDb: any = db;
      mockDb.mockImplementation(() => ({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null) // no duplicate
        }),
        insert: jest.fn().mockResolvedValue([1])
      }));

      const count = await RemindersService.runDailyReminderJob();
      expect(count).toBe(1);
      expect(redisService.set).toHaveBeenCalled();
    });
  });
});
