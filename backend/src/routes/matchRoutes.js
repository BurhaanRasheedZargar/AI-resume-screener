const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { matchBody } = require('../validators');

router.post('/', authenticate, validate({ body: matchBody }), matchController.matchResume);

module.exports = router;
