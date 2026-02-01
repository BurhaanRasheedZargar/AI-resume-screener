const rabbitMQ = require('../config/rabbitmq');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const listenForResults = async () => {
    if (!rabbitMQ.channel) await rabbitMQ.connect();

    const q = 'queue.backend.results';
    await rabbitMQ.channel.assertQueue(q, { durable: true });
    
    await rabbitMQ.channel.bindQueue(q, 'resume.events', 'resume.parsed');
    await rabbitMQ.channel.bindQueue(q, 'resume.events', 'resume.matched'); 
    await rabbitMQ.channel.bindQueue(q, 'resume.events', 'resume.feedback_generated');

    console.log('[INFO] Backend listening for AI results...');

    rabbitMQ.channel.consume(q, async (msg) => {
        if (!msg) return;

        const data = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        try {
            if (routingKey === 'resume.parsed') {
                await prisma.resume.update({
                    where: { id: data.id },
                    data: { status: 'PARSED' }
                });
                await redis.set(`resume:status:${data.id}`, 'PARSED', 3600);
                console.log(`[INFO] Resume ${data.id} status updated to PARSED`);
            } else if (routingKey === 'resume.matched') {
                const existing = await prisma.matchResult.findFirst({
                    where: { resumeId: data.resumeId, jobId: data.jobId }
                });

                if (!existing) {
                    await prisma.matchResult.create({
                        data: {
                            resumeId: data.resumeId,
                            jobId: data.jobId,
                            score: parseFloat(data.score)
                        }
                    });
                    
                    await prisma.resume.update({
                        where: { id: data.resumeId },
                        data: { status: 'MATCHED' }
                    });
                    
                    console.log(`[INFO] Saved Score for ${data.resumeId}`);
                }

            } else if (routingKey === 'resume.feedback_generated') {
                const latestMatch = await prisma.matchResult.findFirst({
                    where: { resumeId: data.resumeId },
                    orderBy: { matchedAt: 'desc' }
                });

                if (latestMatch) {
                    await prisma.matchResult.update({
                        where: { id: latestMatch.id },
                        data: { feedback: data.feedback }
                    });
                }
                
                await prisma.resume.update({
                    where: { id: data.resumeId },
                    data: { status: 'COMPLETED' }
                });
                console.log(`[INFO] Resume ${data.resumeId} COMPLETED`);
            }

            rabbitMQ.channel.ack(msg);
        } catch (err) {
            console.error('[ERROR] Error saving result:', err);
            rabbitMQ.channel.ack(msg);
        }
    });
};

module.exports = listenForResults;