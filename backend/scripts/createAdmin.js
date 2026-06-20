require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/db');

async function createAdmin() {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@resumescreener.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    try {
        const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (existingAdmin) {
            console.log('[INFO] Admin user already exists');
            return;
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await prisma.user.create({
            data: { email: adminEmail, password: hashedPassword, name: 'System Admin', role: 'ADMIN' },
        });

        console.log('[INFO] Admin user created successfully!');
        console.log(`[INFO] Email: ${adminEmail}`);
        if (!process.env.ADMIN_PASSWORD) {
            console.log(`[INFO] Password: ${adminPassword}`);
            console.log('[WARN] Default password in use — set ADMIN_PASSWORD or change it after first login!');
        }
    } catch (error) {
        console.error('[ERROR] Failed to create admin user:', error);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
