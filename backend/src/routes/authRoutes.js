const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const validate = require('../middleware/validate');
const { registerBody, loginBody } = require('../validators');

router.post('/register', authLimiter, validate({ body: registerBody }), authController.register);
router.post('/login', authLimiter, validate({ body: loginBody }), authController.login);
router.get('/me', authenticate, authController.getProfile);

module.exports = router;
