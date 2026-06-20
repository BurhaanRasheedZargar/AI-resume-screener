const path = require('path');
const fs = require('fs/promises');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/db');
const redis = require('../config/redis');
const rabbitMQ = require('../config/rabbitmq');
const logger = require('../config/logger');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const ownershipFilter = (user, id) => ({
    id,
    ...(user.role === 'ADMIN' ? {} : { userId: user.id }),
});

exports.uploadResume = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'No file uploaded');

    const resumeId = uuidv4();
    const filePath = req.file.path;

    await prisma.resume.create({
        data: {
            id: resumeId,
            originalName: req.file.originalname,
            storagePath: filePath,
            status: 'UPLOADED',
            userId: req.user.id,
        },
    });

    await redis.set(`resume:status:${resumeId}`, 'UPLOADED', 3600);

    await rabbitMQ.publish('resume.uploaded', {
        id: resumeId,
        filename: req.file.originalname,
        path: path.resolve(filePath),
    });

    res.status(202).json({ message: 'Resume accepted', data: { resumeId } });
});

exports.getResumeStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const cachedStatus = await redis.get(`resume:status:${id}`);
    if (cachedStatus) return res.json({ status: cachedStatus });

    const resume = await prisma.resume.findFirst({
        where: ownershipFilter(req.user, id),
        select: { status: true },
    });

    if (!resume) throw new ApiError(404, 'Resume not found');
    res.json({ status: resume.status });
});

exports.getResumeResult = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const resume = await prisma.resume.findFirst({
        where: ownershipFilter(req.user, id),
        include: {
            matches: { include: { job: true }, orderBy: { matchedAt: 'desc' }, take: 1 },
        },
    });

    if (!resume) throw new ApiError(404, 'Resume not found');

    const match = resume.matches[0];
    let feedback = match?.feedback;
    if (!feedback) {
        feedback = await redis.get(`resume:feedback:${id}`);
    }

    res.json({
        resumeId: resume.id,
        status: resume.status,
        fileName: resume.originalName,
        jobTitle: match?.job.title || 'Pending',
        score: match?.score ?? 0,
        feedback: feedback || 'Feedback pending...',
        updatedAt: match?.matchedAt || resume.uploadedAt,
    });
});

exports.getMyResumes = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;

    const [resumes, total] = await Promise.all([
        prisma.resume.findMany({
            where: { userId: req.user.id },
            orderBy: { uploadedAt: 'desc' },
            include: { matches: { include: { job: true }, orderBy: { matchedAt: 'desc' }, take: 1 } },
            skip,
            take: limit,
        }),
        prisma.resume.count({ where: { userId: req.user.id } }),
    ]);

    res.json({ resumes, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.deleteResume = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const resume = await prisma.resume.findFirst({ where: ownershipFilter(req.user, id) });
    if (!resume) throw new ApiError(404, 'Resume not found');

    await prisma.resume.delete({ where: { id } });

    if (resume.storagePath) {
        await fs.unlink(resume.storagePath).catch((err) =>
            logger.warn({ err, path: resume.storagePath }, 'Failed to delete resume file')
        );
    }
    await Promise.all([
        redis.set(`resume:status:${id}`, 'DELETED', 60),
        redis.client?.del(`resume:parsed:${id}`, `resume:score:${id}`, `resume:feedback:${id}`),
    ]).catch(() => {});

    res.json({ message: 'Resume deleted' });
});
