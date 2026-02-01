const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createJob = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Authentication required' });
        if (req.user.role !== 'RECRUITER' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only recruiters can create jobs' });
        }

        const { title, description, skills_required } = req.body;
        
        const job = await prisma.job.create({
            data: {
                title,
                description,
                skills: JSON.stringify(skills_required || []),
                userId: req.user.id
            }
        });

        res.status(201).json({ message: 'Job Created', job });
    } catch (error) {
        console.error('[ERROR] Create Job Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAllJobs = async (req, res) => {
    try {
        const jobs = await prisma.job.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });
        res.json(jobs);
    } catch (error) {
        console.error('[ERROR] Get All Jobs Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getMyJobs = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Authentication required' });

        const jobs = await prisma.job.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                matches: {
                    include: { resume: true },
                    orderBy: { score: 'desc' }
                }
            }
        });

        res.json({ jobs });
    } catch (error) {
        console.error('[ERROR] Get My Jobs Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getJobById = async (id) => {
    return await prisma.job.findUnique({ where: { id } });
};