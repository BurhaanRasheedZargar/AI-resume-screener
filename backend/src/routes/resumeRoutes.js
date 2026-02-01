const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.post('/upload', authenticate, upload.single('resume'), resumeController.uploadResume);
router.get('/my', authenticate, resumeController.getMyResumes);
router.get('/:id/status', authenticate, resumeController.getResumeStatus);
router.get('/:id/result', authenticate, resumeController.getResumeResult);

module.exports = router;