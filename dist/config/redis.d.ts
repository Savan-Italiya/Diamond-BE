import Redis from 'ioredis';
declare class RedisService {
    private static instance;
    client: Redis;
    private isConnected;
    private constructor();
    static getInstance(): RedisService;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    flush(): Promise<void>;
}
export declare const redisService: RedisService;
export {};
