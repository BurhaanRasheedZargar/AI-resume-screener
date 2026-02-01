const amqp = require('amqplib');

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.exchange = 'resume.events';
    }

    async connect() {
        try {
            console.log('[INFO] Connecting to RabbitMQ...');
            this.connection = await amqp.connect(process.env.RABBITMQ_URL);
            this.channel = await this.connection.createChannel();

            await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

            console.log('[INFO] Connected to RabbitMQ');
        } catch (error) {
            console.error('[ERROR] RabbitMQ Connection Failed:', error);
            process.exit(1);
        }
    }

    async publish(routingKey, message) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized');
        }

        const buffer = Buffer.from(JSON.stringify(message));
        
        this.channel.publish(this.exchange, routingKey, buffer);
        
        console.log(`[INFO] Event Published: ${routingKey}`);
    }
    
    async close() {
        if (this.connection) await this.connection.close();
    }
}

// Export a singleton instance
module.exports = new RabbitMQService();