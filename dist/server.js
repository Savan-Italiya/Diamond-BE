"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const connection_1 = require("./database/connection");
const kafka_consumer_1 = require("./jobs/kafka-consumer");
const payment_reminder_cron_1 = require("./jobs/payment-reminder.cron");
const PORT = env_1.config.port;
async function bootstrap() {
    console.log('💎 Starting Diamond ERP Backend Service (Mumbai BKC)...');
    // Verify DB connectivity
    const dbHealthy = await (0, connection_1.checkDatabaseHealth)();
    if (dbHealthy) {
        console.log('✅ PostgreSQL database connection established');
    }
    else {
        console.warn('⚠️ PostgreSQL connection failed or waiting for container');
    }
    // Initialize Kafka Consumers in the background
    (0, kafka_consumer_1.initKafkaConsumers)().catch((err) => {
        console.warn('⚠️ Kafka consumers initialization skipped:', err.message);
    });
    // Start Cron Jobs
    payment_reminder_cron_1.PaymentReminderCron.start();
    const server = app_1.default.listen(PORT, () => {
        console.log(`🚀 Diamond ERP API Server listening on port ${PORT} [${env_1.config.env}]`);
        console.log(`📍 Health Check: http://localhost:${PORT}/health`);
    });
    const shutdown = async (signal) => {
        console.log(`Received ${signal}. Shutting down gracefully...`);
        payment_reminder_cron_1.PaymentReminderCron.stop();
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
//# sourceMappingURL=server.js.map