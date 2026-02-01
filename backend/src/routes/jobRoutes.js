const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, jobController.createJob);
router.get('/my', authenticate, jobController.getMyJobs);
router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJobById);

module.exports = router;