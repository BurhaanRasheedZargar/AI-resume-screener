require('dotenv').config();
const app = require('./app');
const rabbitMQ = require('./config/rabbitmq');
const redis = require('./config/redis');
const listenForResults = require('./workers/resultWorker');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await rabbitMQ.connect();
        await redis.connect();
        listenForResults();

        const server = app.listen(PORT, () => {
            console.log(`[INFO] Server running on port ${PORT}`);
        });

        process.on('SIGTERM', async () => {
            console.log('[INFO] SIGTERM received. Shutting down...');
            await rabbitMQ.close();
            await redis.quit();
            server.close(() => console.log('[INFO] Process terminated'));
        });
        
    } catch (error) {
        console.error('[ERROR] Failed to start server:', error);
        process.exit(1);
    }
};

startServer();