const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, matchController.matchResume);

module.exports = router;