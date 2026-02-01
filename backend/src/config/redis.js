const Redis = require('ioredis');

class RedisService {
    constructor() {
        this.client = null;
    }

    connect() {
        if (!process.env.REDIS_URL) {
            console.error('[ERROR] REDIS_URL not defined in .env');
            process.exit(1);
        }

        this.client = new Redis(process.env.REDIS_URL, {
            lazyConnect: true
        });

        this.client.on('connect', () => {
            console.log('[INFO] Connected to Redis');
        });

        this.client.on('error', (err) => {
            console.error('[ERROR] Redis Error:', err);
        });

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
        try {
            return JSON.parse(value);
        } catch (e) {
            return value; 
        }
    }

    async quit() {
        if (this.client) await this.client.quit();
    }
}

module.exports = new RedisService();