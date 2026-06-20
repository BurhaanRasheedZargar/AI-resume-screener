const rabbitMQ = require('../config/rabbitmq');
const redis = require('../config/redis');
const prisma = require('../config/db');
const { getJobById } = require('./jobController');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

exports.matchResume = asyncHandler(async (req, res) => {
    const { resumeId, jobId } = req.body;

    const resume = await prisma.resume.findFirst({
        where: {
            id: resumeId,
            ...(req.user.role === 'ADMIN' ? {} : { userId: req.user.id }),
        },
    });
    if (!resume) throw new ApiError(404, 'Resume not found');

    const job = await getJobById(jobId);
    if (!job) throw new ApiError(404, 'Job not found');

    await rabbitMQ.publish('resume.match_requested', {
        resumeId,
        jobId,
        jobDescription: job.description,
        resumeText: resume.parsedContent || undefined,
    });
    await redis.set(`resume:status:${resumeId}`, 'MATCHING_REQUESTED');

    res.status(202).json({
        message: 'Matching started',
        statusEndpoint: `/api/resume/${resumeId}/status`,
    });
});
