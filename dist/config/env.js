"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    db: {
        client: process.env.DB_CLIENT || 'pg',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres_secure_2026',
        database: process.env.DB_NAME || 'diamond_erp_mumbai'
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined
    },
    kafka: {
        clientId: process.env.KAFKA_CLIENT_ID || 'diamond-erp-service',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        groupId: process.env.KAFKA_GROUP_ID || 'diamond-erp-consumers'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'bkc_opera_house_diamond_erp_jwt_secret_key_2026_super_secure',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info'
    }
};
//# sourceMappingURL=env.js.map