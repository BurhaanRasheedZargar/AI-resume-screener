require('dotenv').config();
const { z } = require('zod');

const schema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z
        .string()
        .min(32, 'JWT_SECRET must be at least 32 characters (use: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))")'),
    JWT_EXPIRES_IN: z.string().default('7d'),

    RABBITMQ_URL: z.string().min(1, 'RABBITMQ_URL is required'),
    REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

    CORS_ORIGIN: z.string().default('http://localhost:5173'),

    UPLOAD_FOLDER: z.string().default('./uploads'),
    MAX_UPLOAD_MB: z.coerce.number().positive().default(5),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
    console.error('[FATAL] Invalid environment configuration:');
    for (const issue of parsed.error.issues) {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
}

const env = parsed.data;

env.CORS_ORIGINS = env.CORS_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

module.exports = env;
