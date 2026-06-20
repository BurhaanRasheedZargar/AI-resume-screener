const amqp = require('amqplib');
const env = require('./env');
const logger = require('./logger');

const RECONNECT_DELAY_MS = 5000;

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.exchange = 'resume.events';
        this.closing = false;
        this.onChannelReady = [];
    }

    async connect() {
        try {
            logger.info('Connecting to RabbitMQ...');
            this.connection = await amqp.connect(env.RABBITMQ_URL);
            this.channel = await this.connection.createChannel();

            await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

            this.connection.on('error', (err) => logger.error({ err }, 'RabbitMQ connection error'));
            this.connection.on('close', () => {
                if (this.closing) return;
                logger.warn(`RabbitMQ connection closed. Reconnecting in ${RECONNECT_DELAY_MS}ms...`);
                this.channel = null;
                this.connection = null;
                setTimeout(() => this.reconnect(), RECONNECT_DELAY_MS);
            });

            logger.info('Connected to RabbitMQ');

            for (const setup of this.onChannelReady) {
                await setup();
            }
        } catch (error) {
            logger.error({ err: error }, 'RabbitMQ connection failed');
            throw error;
        }
    }

    async reconnect() {
        try {
            await this.connect();
        } catch {
            logger.warn(`Reconnect failed. Retrying in ${RECONNECT_DELAY_MS}ms...`);
            setTimeout(() => this.reconnect(), RECONNECT_DELAY_MS);
        }
    }

    registerConsumer(setupFn) {
        this.onChannelReady.push(setupFn);
        if (this.channel) return setupFn();
    }

    async publish(routingKey, message) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized');
        }
        const buffer = Buffer.from(JSON.stringify(message));
        this.channel.publish(this.exchange, routingKey, buffer, { persistent: true });
        logger.debug({ routingKey }, 'Event published');
    }

    isHealthy() {
        return Boolean(this.connection && this.channel);
    }

    async close() {
        this.closing = true;
        if (this.channel) await this.channel.close().catch(() => {});
        if (this.connection) await this.connection.close().catch(() => {});
    }
}

module.exports = new RabbitMQService();
