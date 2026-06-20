const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

exports.createJob = asyncHandler(async (req, res) => {
    const { title, description, skills_required } = req.body;

    const job = await prisma.job.create({
        data: {
            title,
            description,
            skills: JSON.stringify(skills_required || []),
            userId: req.user.id,
        },
    });

    res.status(201).json({ message: 'Job Created', job });
});

exports.getAllJobs = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
        prisma.job.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, email: true } } },
            skip,
            take: limit,
        }),
        prisma.job.count(),
    ]);

    res.set('X-Total-Count', String(total));
    res.set('X-Total-Pages', String(Math.ceil(total / limit)));
    res.json(jobs);
});

exports.getMyJobs = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
        prisma.job.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            include: { matches: { include: { resume: true }, orderBy: { score: 'desc' } } },
            skip,
            take: limit,
        }),
        prisma.job.count({ where: { userId: req.user.id } }),
    ]);

    res.json({ jobs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.getJob = asyncHandler(async (req, res) => {
    const job = await prisma.job.findUnique({
        where: { id: req.params.id },
        include: { user: { select: { name: true, email: true } } },
    });
    if (!job) throw new ApiError(404, 'Job not found');
    res.json(job);
});

exports.deleteJob = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const where = { id, ...(req.user.role === 'ADMIN' ? {} : { userId: req.user.id }) };

    const job = await prisma.job.findFirst({ where });
    if (!job) throw new ApiError(404, 'Job not found');

    await prisma.job.delete({ where: { id } });
    res.json({ message: 'Job deleted' });
});

exports.getJobById = (id) => prisma.job.findUnique({ where: { id } });
