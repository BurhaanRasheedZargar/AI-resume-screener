const rabbitMQ = require('../config/rabbitmq');
const redis = require('../config/redis');
const prisma = require('../config/db');
const logger = require('../config/logger');

const QUEUE = 'queue.backend.results';

async function handleMessage(msg) {
    if (!msg) return;

    const data = JSON.parse(msg.content.toString());
    const routingKey = msg.fields.routingKey;

    try {
        if (routingKey === 'resume.parsed') {
            const cached = await redis.get(`resume:parsed:${data.id}`);
            const parsedContent = cached?.text || null;

            await prisma.resume.update({
                where: { id: data.id },
                data: { status: 'PARSED', ...(parsedContent ? { parsedContent } : {}) },
            });
            await redis.set(`resume:status:${data.id}`, 'PARSED', 3600);
            logger.info({ resumeId: data.id }, 'Resume status updated to PARSED');
        } else if (routingKey === 'resume.matched') {
            const existing = await prisma.matchResult.findFirst({
                where: { resumeId: data.resumeId, jobId: data.jobId },
            });

            if (!existing) {
                await prisma.matchResult.create({
                    data: { resumeId: data.resumeId, jobId: data.jobId, score: parseFloat(data.score) },
                });
                await prisma.resume.update({ where: { id: data.resumeId }, data: { status: 'MATCHED' } });
                logger.info({ resumeId: data.resumeId, score: data.score }, 'Saved match score');
            }
        } else if (routingKey === 'resume.feedback_generated') {
            const latestMatch = await prisma.matchResult.findFirst({
                where: { resumeId: data.resumeId },
                orderBy: { matchedAt: 'desc' },
            });

            if (latestMatch) {
                await prisma.matchResult.update({
                    where: { id: latestMatch.id },
                    data: { feedback: data.feedback },
                });
            }

            await prisma.resume.update({ where: { id: data.resumeId }, data: { status: 'COMPLETED' } });
            logger.info({ resumeId: data.resumeId }, 'Resume COMPLETED');
        }

        rabbitMQ.channel.ack(msg);
    } catch (err) {
        logger.error({ err, routingKey }, 'Error saving result');
        rabbitMQ.channel.ack(msg);
    }
}

const listenForResults = () => {
    rabbitMQ.registerConsumer(async () => {
        const ch = rabbitMQ.channel;
        await ch.assertQueue(QUEUE, { durable: true });
        await ch.bindQueue(QUEUE, rabbitMQ.exchange, 'resume.parsed');
        await ch.bindQueue(QUEUE, rabbitMQ.exchange, 'resume.matched');
        await ch.bindQueue(QUEUE, rabbitMQ.exchange, 'resume.feedback_generated');
        await ch.consume(QUEUE, handleMessage);
        logger.info('Backend listening for AI results...');
    });
};

module.exports = listenForResults;
