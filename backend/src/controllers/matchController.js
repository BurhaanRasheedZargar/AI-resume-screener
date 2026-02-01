const rabbitMQ = require('../config/rabbitmq');
const redis = require('../config/redis');
const { PrismaClient } = require('@prisma/client');
const { getJobById } = require('./jobController');
const prisma = new PrismaClient(); 

exports.matchResume = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Authentication required' });

        const { resumeId, jobId } = req.body;
        
        const resume = await prisma.resume.findFirst({
            where: { 
                id: resumeId,
                userId: req.user.role === 'ADMIN' ? undefined : req.user.id
            }
        });

        if (!resume) return res.status(404).json({ error: 'Resume not found' });
        
        const job = await getJobById(jobId);
        if (!job) return res.status(404).json({ error: 'Job not found' });

        const payload = {
            resumeId,
            jobId,
            jobDescription: job.description
        };

        await rabbitMQ.publish('resume.match_requested', payload);
        await redis.set(`resume:status:${resumeId}`, 'MATCHING_REQUESTED');

        res.status(202).json({ 
            message: 'Matching started',
            statusEndpoint: `/api/resume/${resumeId}/status`
        });

    } catch (error) {
        console.error('[ERROR] Match Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};