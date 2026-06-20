const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createJobBody, idParam, paginationQuery } = require('../validators');

router.post('/', authenticate, authorize('RECRUITER', 'ADMIN'), validate({ body: createJobBody }), jobController.createJob);
router.get('/my', authenticate, validate({ query: paginationQuery }), jobController.getMyJobs);
router.get('/', validate({ query: paginationQuery }), jobController.getAllJobs);
router.get('/:id', validate({ params: idParam }), jobController.getJob);
router.delete('/:id', authenticate, authorize('RECRUITER', 'ADMIN'), validate({ params: idParam }), jobController.deleteJob);

module.exports = router;
