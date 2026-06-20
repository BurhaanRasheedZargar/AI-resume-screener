const env = require('./config/env');
const logger = require('./config/logger');
const app = require('./app');
const rabbitMQ = require('./config/rabbitmq');
const redis = require('./config/redis');
const prisma = require('./config/db');
const listenForResults = require('./workers/resultWorker');

const startServer = async () => {
    try {
        await rabbitMQ.connect();
    } catch (err) {
        logger.error({ err }, 'Initial RabbitMQ connect failed; will keep retrying');
        rabbitMQ.reconnect();
    }

    try {
        await redis.connect();
    } catch (err) {
        logger.error({ err }, 'Initial Redis connect failed; client will retry');
    }

    listenForResults();

    const server = app.listen(env.PORT, () => logger.info(`Server running on port ${env.PORT}`));

    const shutdown = async (signal) => {
        logger.info(`${signal} received. Shutting down...`);
        server.close(async () => {
            await rabbitMQ.close().catch(() => {});
            await redis.quit().catch(() => {});
            await prisma.$disconnect().catch(() => {});
            logger.info('Process terminated');
            process.exit(0);
        });
        setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
