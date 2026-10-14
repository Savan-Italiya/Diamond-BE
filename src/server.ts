import app from './app';
import { config } from './config/env';
import { checkDatabaseHealth } from './database/connection';
import { initKafkaConsumers } from './jobs/kafka-consumer';
import { PaymentReminderCron } from './jobs/payment-reminder.cron';

const PORT = config.port;

async function bootstrap() {
  console.log('💎 Starting Diamond ERP Backend Service (Mumbai BKC)...');

  // Verify DB connectivity
  const dbHealthy = await checkDatabaseHealth();
  if (dbHealthy) {
    console.log('✅ PostgreSQL database connection established');
  } else {
    console.warn('⚠️ PostgreSQL connection failed or waiting for container');
  }

  // Initialize Kafka Consumers in the background
  initKafkaConsumers().catch((err) => {
    console.warn('⚠️ Kafka consumers initialization skipped:', err.message);
  });

  // Start Cron Jobs
  PaymentReminderCron.start();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Diamond ERP API Server listening on port ${PORT} [${config.env}]`);
    console.log(`📍 Health Check: http://localhost:${PORT}/health`);
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    PaymentReminderCron.stop();
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
