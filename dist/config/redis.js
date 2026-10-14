"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
class RedisService {
    static instance;
    client;
    isConnected = false;
    constructor() {
        this.client = new ioredis_1.default({
            host: env_1.config.redis.host,
            port: env_1.config.redis.port,
            password: env_1.config.redis.password,
            lazyConnect: true,
            retryStrategy: (times) => {
                if (times > 3) {
                    // In dev or test environments without Redis running, don't crash
                    return null;
                }
                return Math.min(times * 100, 2000);
            }
        });
        this.client.on('connect', () => {
            this.isConnected = true;
            console.log('✅ Connected to Redis cache service');
        });
        this.client.on('error', (err) => {
            this.isConnected = false;
            // Soft warning in dev mode
            if (env_1.config.env !== 'test') {
                console.warn('⚠️ Redis connection warning:', err.message);
            }
        });
    }
    static getInstance() {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }
    async get(key) {
        try {
            if (!this.isConnected && env_1.config.env === 'test')
                return null;
            return await this.client.get(key);
        }
        catch {
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            if (!this.isConnected && env_1.config.env === 'test')
                return;
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, value);
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch (err) {
            console.warn('Redis set error:', err);
        }
    }
    async del(key) {
        try {
            if (!this.isConnected && env_1.config.env === 'test')
                return;
            await this.client.del(key);
        }
        catch (err) {
            console.warn('Redis del error:', err);
        }
    }
    async flush() {
        try {
            await this.client.flushall();
        }
        catch {
            // ignore
        }
    }
}
exports.redisService = RedisService.getInstance();
//# sourceMappingURL=redis.js.map