import Redis from 'ioredis';
import { config } from './env';

class RedisService {
  private static instance: RedisService;
  public client: Redis;
  private isConnected = false;

  private constructor() {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
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
      if (config.env !== 'test') {
        console.warn('⚠️ Redis connection warning:', err.message);
      }
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async get(key: string): Promise<string | null> {
    if (config.env === 'test') return null;
    try {
      if (!this.isConnected) return null;
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (config.env === 'test') return;
    try {
      if (!this.isConnected) return;
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (err) {
      console.warn('Redis set error:', err);
    }
  }

  public async del(key: string): Promise<void> {
    if (config.env === 'test') return;
    try {
      if (!this.isConnected) return;
      await this.client.del(key);
    } catch (err) {
      console.warn('Redis del error:', err);
    }
  }

  public async flush(): Promise<void> {
    if (config.env === 'test') return;
    try {
      await this.client.flushall();
    } catch {
      // ignore
    }
  }
}

export const redisService = RedisService.getInstance();
