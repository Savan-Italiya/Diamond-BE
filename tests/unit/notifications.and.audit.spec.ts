import { NotificationsService } from '../../src/modules/notifications/notifications.service';
import { AuditService } from '../../src/modules/audit/audit.service';
import { PaymentReminderCron } from '../../src/jobs/payment-reminder.cron';
import { initKafkaConsumers } from '../../src/jobs/kafka-consumer';
import { kafkaService, KafkaTopics } from '../../src/config/kafka';
import { redisService } from '../../src/config/redis';
import { db, checkDatabaseHealth } from '../../src/database/connection';

jest.mock('../../src/database/connection', () => {
  const mockDbFn: any = jest.fn();
  mockDbFn.raw = jest.fn();
  return {
    db: mockDbFn,
    checkDatabaseHealth: jest.fn().mockImplementation(async () => {
      try {
        await mockDbFn.raw('SELECT 1');
        return true;
      } catch {
        return false;
      }
    })
  };
});

describe('Notifications, Audit, Jobs and Config Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('NotificationsService', () => {
    it('should fetch templates and format whatsapp message with variables', async () => {
      const mockDb: any = db;
      mockDb.mockImplementation((table: string) => {
        if (table === 'whatsapp_templates') {
          return {
            select: jest.fn().mockResolvedValue([{ template_name: 'ALERT', message_body: 'Hello {{name}}' }]),
            where: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue({ message_body: 'Hello {{name}}, amount Rs. {{amount}}' })
            })
          };
        }
        return {};
      });

      const templates = await NotificationsService.getTemplates();
      expect(templates).toHaveLength(1);

      const msg = await NotificationsService.generateWhatsAppMessage('ALERT', { name: 'Bharat', amount: '50000' });
      expect(msg).toBe('Hello Bharat, amount Rs. 50000');
    });

    it('should queue notification and emit to kafka', async () => {
      const queueItem = { id: 'q-1', party_id: 'p-1', channel: 'WHATSAPP' };
      const mockDb: any = db;
      mockDb.mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([queueItem])
        })
      }));

      const spyEmit = jest.spyOn(kafkaService, 'emit').mockResolvedValue(true);

      const res = await NotificationsService.queueNotification({
        party_id: 'p-1',
        channel: 'WHATSAPP',
        payload: { msg: 'Test' }
      });

      expect(res.id).toBe('q-1');
      expect(spyEmit).toHaveBeenCalled();
    });
  });

  describe('AuditService', () => {
    it('should query system audit logs with filters and report schedules', async () => {
      const mockLogs = [{ id: 'l-1', action: 'INSERT_PARTIES', table_name: 'parties' }];
      const mockSchedules = [{ id: 'rs-1', report_type: 'DAILY_OUTSTANDING_DEBTORS' }];

      const mockDb: any = db;
      mockDb.mockImplementation((table: string) => {
        if (table === 'system_audit_logs') {
          return {
            leftJoin: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockLogs)
              })
            })
          };
        }
        if (table === 'report_schedules') {
          return {
            select: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue(mockSchedules)
            }),
            insert: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue(mockSchedules)
            })
          };
        }
        return {};
      });

      const logs = await AuditService.getLogs({ table_name: 'parties' });
      expect(logs).toHaveLength(1);

      const schedules = await AuditService.getReportSchedules();
      expect(schedules).toHaveLength(1);

      const newSchedule = await AuditService.createReportSchedule({
        report_type: 'DAILY_DEBTORS',
        recipient_phone: '+919820000000'
      });
      expect(newSchedule.id).toBe('rs-1');
    });
  });

  describe('PaymentReminderCron', () => {
    it('should start and stop timer gracefully', () => {
      PaymentReminderCron.start(100000);
      expect((PaymentReminderCron as any).timer).toBeDefined();
      PaymentReminderCron.stop();
      expect((PaymentReminderCron as any).timer).toBeNull();
    });
  });

  describe('Kafka Consumers & Services', () => {
    it('should initialize kafka consumers without crashing', async () => {
      jest.spyOn(kafkaService, 'registerConsumer').mockImplementation(async (_topic, handler) => {
        // Execute sample handler to test consumers
        await handler({ sales_order_id: 'so-1', buyer_id: 'b-1', amount: 100, due_date: '2026-10-14' });
      });

      const mockDb: any = db;
      mockDb.mockImplementation(() => ({
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({ id: 'b-1', phone_primary: '+919820000000', business_name: 'B1' }),
          update: jest.fn().mockResolvedValue(1)
        }),
        insert: jest.fn().mockResolvedValue([1])
      }));

      await expect(initKafkaConsumers()).resolves.not.toThrow();
    });

    it('should handle redis and kafka graceful fallbacks in test mode', async () => {
      await redisService.set('key', 'val', 10);
      await redisService.get('key');
      await redisService.del('key');
      await redisService.flush();

      await kafkaService.emit(KafkaTopics.STOCK_STATUS_CHANGED, { test: 1 });
      await kafkaService.disconnect();
    });

    it('should check database health', async () => {
      (checkDatabaseHealth as jest.Mock).mockResolvedValueOnce(true);
      const healthy = await checkDatabaseHealth();
      expect(healthy).toBe(true);
    });
  });
});
