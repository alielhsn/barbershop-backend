//barbershopfourr/server/Routes/blockedSlotsRoutes.js
const express = require('express');
const blockedSlotsController = require('../controllers/blockedSlotsController');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

// Public route - no authentication required to get blocked slots for a specific barber/date
router.get('/', blockedSlotsController.getBlockedSlots);

// Protected routes requiring authentication
router.get('/all', authenticateToken, isAdmin, blockedSlotsController.getAllBlockedSlots);
router.post('/', authenticateToken, isAdmin, blockedSlotsController.createBlockedSlot);
router.delete('/:id', authenticateToken, isAdmin, blockedSlotsController.deleteBlockedSlot);

module.exports = router;