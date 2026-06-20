const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const env = require('../config/env');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const signToken = (userId) => jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

exports.register = asyncHandler(async (req, res) => {
    const { email, password, name, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new ApiError(409, 'Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { email, password: hashedPassword, name, role },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const token = signToken(user.id);
    res.status(201).json({ message: 'User registered successfully', user, token });
});

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const token = signToken(user.id);
    res.json({
        message: 'Login successful',
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token,
    });
});

exports.getProfile = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json({ user });
});
