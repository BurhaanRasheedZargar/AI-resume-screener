const { z } = require('zod');

const uuid = z.string().uuid('Invalid id');

const idParam = z.object({ id: uuid });

const paginationQuery = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

const registerBody = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    name: z.string().trim().min(1).max(120),
    role: z.enum(['CANDIDATE', 'RECRUITER']).default('CANDIDATE'),
});

const loginBody = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1, 'Password is required'),
});

const createJobBody = z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(20000),
    skills_required: z.array(z.string().trim().min(1)).max(100).optional().default([]),
});

const matchBody = z.object({
    resumeId: uuid,
    jobId: uuid,
});

module.exports = {
    idParam,
    paginationQuery,
    registerBody,
    loginBody,
    createJobBody,
    matchBody,
};
