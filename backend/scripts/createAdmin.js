const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
    try {
        const adminEmail = 'admin@resumescreener.com';
        const adminPassword = 'admin123';
        
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingAdmin) {
            console.log('[INFO] Admin user already exists');
            return;
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        const admin = await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                name: 'System Admin',
                role: 'ADMIN'
            }
        });

        console.log('[INFO] Admin user created successfully!');
        console.log(`[INFO] Email: ${adminEmail}`);
        console.log(`[INFO] Password: ${adminPassword}`);
        console.log('[WARN] Please change the password after first login!');
    } catch (error) {
        console.error('[ERROR] Failed to create admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();

