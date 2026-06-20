const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam, paginationQuery } = require('../validators');
const { ApiError } = require('../middleware/errorHandler');
const env = require('../config/env');

const UPLOAD_DIR = env.UPLOAD_FOLDER;
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_EXT = new Set(['.pdf', '.docx']);
const ALLOWED_MIME = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
    },
});

const upload = multer({
    storage,
    limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ALLOWED_EXT.has(ext) && ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
        cb(new ApiError(400, 'Only PDF and DOCX files are allowed'));
    },
});

router.post('/upload', authenticate, upload.single('resume'), resumeController.uploadResume);
router.get('/my', authenticate, validate({ query: paginationQuery }), resumeController.getMyResumes);
router.get('/:id/status', authenticate, validate({ params: idParam }), resumeController.getResumeStatus);
router.get('/:id/result', authenticate, validate({ params: idParam }), resumeController.getResumeResult);
router.delete('/:id', authenticate, validate({ params: idParam }), resumeController.deleteResume);

module.exports = router;
