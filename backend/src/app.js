const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');

const env = require('./config/env');
const logger = require('./config/logger');
const redis = require('./config/redis');
const rabbitMQ = require('./config/rabbitmq');
const prisma = require('./config/db');

const resumeRoutes = require('./routes/resumeRoutes');
const jobRoutes = require('./routes/jobRoutes');
const matchRoutes = require('./routes/matchRoutes');
const authRoutes = require('./routes/authRoutes');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin || env.CORS_ORIGINS.includes(origin)) return cb(null, true);
            cb(new Error('Not allowed by CORS'));
        },
    })
);
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/match', matchRoutes);

app.get('/health', async (req, res) => {
    const checks = { database: 'down', redis: 'down', rabbitmq: 'down' };

    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = 'up';
    } catch {
        /* leave as down */
    }
    try {
        if (await redis.ping()) checks.redis = 'up';
    } catch {
        /* leave as down */
    }
    checks.rabbitmq = rabbitMQ.isHealthy() ? 'up' : 'down';

    const allUp = Object.values(checks).every((s) => s === 'up');
    res.status(allUp ? 200 : 503).json({
        status: allUp ? 'UP' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        service: 'Resume Screener API',
        checks,
    });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
