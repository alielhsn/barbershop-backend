// barbershopfourr/server/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { checkAdminLoginAttempts, recordAdminLoginAttempt } = require('../middlewares/securityMiddleware'); // Add this import

const router = express.Router();

// Apply security middleware to login route
router.post('/login', checkAdminLoginAttempts, recordAdminLoginAttempt, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/verify', authenticateToken, authController.verifyToken);

module.exports = router;