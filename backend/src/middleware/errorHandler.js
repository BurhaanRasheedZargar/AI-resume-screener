const { ZodError } = require('zod');
const { Prisma } = require('@prisma/client');
const multer = require('multer');
const logger = require('../config/logger');

class ApiError extends Error {
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
        this.expose = true;
    }
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const notFound = (req, res) => {
    res.status(404).json({ error: 'Route not found' });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
    }

    if (err instanceof ZodError) {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        });
    }

    if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large' : err.message;
        return res.status(400).json({ error: message });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') return res.status(409).json({ error: 'Resource already exists' });
        if (err.code === 'P2025') return res.status(404).json({ error: 'Resource not found' });
    }

    logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error' });
};

module.exports = { ApiError, asyncHandler, notFound, errorHandler };
