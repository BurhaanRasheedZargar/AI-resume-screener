const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const redis = require('../config/redis');
const rabbitMQ = require('../config/rabbitmq');

exports.uploadResume = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        if (!req.user) return res.status(401).json({ error: 'Authentication required' });

        const resumeId = uuidv4();
        const filePath = req.file.path;

        const resume = await prisma.resume.create({
            data: {
                id: resumeId,
                originalName: req.file.originalname,
                storagePath: filePath,
                status: 'UPLOADED',
                userId: req.user.id
            }
        });

        await redis.set(`resume:status:${resumeId}`, 'UPLOADED', 3600);
        
        const payload = {
            id: resumeId,
            filename: req.file.originalname,
            path: path.resolve(filePath),
        };
        await rabbitMQ.publish('resume.uploaded', payload);

        res.status(202).json({
            message: 'Resume accepted',
            data: { resumeId }
        });

    } catch (error) {
        console.error('[ERROR] Upload Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getResumeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user) return res.status(401).json({ error: 'Authentication required' });

        const cachedStatus = await redis.get(`resume:status:${id}`);
        if (cachedStatus) return res.json({ status: cachedStatus });

        const resume = await prisma.resume.findFirst({ 
            where: { 
                id,
                userId: req.user.role === 'ADMIN' ? undefined : req.user.id
            },
            select: { status: true } 
        });
        
        if (resume) return res.json({ status: resume.status });

        res.status(404).json({ error: 'Resume not found' });
    } catch (error) {
        console.error('[ERROR] Get Status Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getResumeResult = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user) return res.status(401).json({ error: 'Authentication required' });

        const resume = await prisma.resume.findFirst({
             where: { 
                 id,
                 userId: req.user.role === 'ADMIN' ? undefined : req.user.id
             },
             include: { 
                 matches: { 
                     include: { job: true },
                     orderBy: { matchedAt: 'desc' },
                     take: 1
                 } 
             } 
        });

        if (!resume) return res.status(404).json({ error: 'Resume not found' });

        const match = resume.matches[0];

        let feedback = match?.feedback;
        if (!feedback) {
             feedback = await redis.get(`resume:feedback:${id}`);
        }

        res.json({
            resumeId: resume.id,
            status: resume.status,
            fileName: resume.originalName,
            jobTitle: match?.job.title || "Pending",
            score: match?.score || 0,
            feedback: feedback || "Feedback pending...",
            updatedAt: match?.matchedAt || resume.uploadedAt
        });

    } catch (error) {
        console.error('[ERROR] Get Result Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getMyResumes = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Authentication required' });

        const resumes = await prisma.resume.findMany({
            where: { userId: req.user.id },
            orderBy: { uploadedAt: 'desc' },
            include: {
                matches: {
                    include: { job: true },
                    orderBy: { matchedAt: 'desc' },
                    take: 1
                }
            }
        });

        res.json({ resumes });
    } catch (error) {
        console.error('[ERROR] Get resumes error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};