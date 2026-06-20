const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

class RedisService {
    constructor() {
        this.client = null;
    }

    connect() {
        this.client = new Redis(env.REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times * 200, 2000),
        });

        this.client.on('connect', () => logger.info('Connected to Redis'));
        this.client.on('error', (err) => logger.error({ err }, 'Redis error'));
        this.client.on('reconnecting', () => logger.warn('Reconnecting to Redis...'));

        return this.client.connect();
    }

    async set(key, value, ttl = 3600) {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
        if (ttl) {
            await this.client.set(key, stringValue, 'EX', ttl);
        } else {
            await this.client.set(key, stringValue);
        }
    }

    async get(key) {
        const value = await this.client.get(key);
        if (value === null) return null;
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    async ping() {
        return this.client.ping();
    }

    isHealthy() {
        return this.client?.status === 'ready';
    }

    async quit() {
        if (this.client) await this.client.quit();
    }
}

module.exports = new RedisService();
