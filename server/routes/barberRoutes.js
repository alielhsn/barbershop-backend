//barbershopfourr/server/routes/barberRoutes.js
const express = require('express');
const barberController = require('../controllers/barberController');
const upload = require('../middlewares/upload');
const { isAdmin } = require('../middlewares/authMiddleware'); // Import admin middleware
const router = express.Router();

// Public route - no authentication required to get barbers
router.get('/', barberController.getBarbers);

// Admin-only routes - require authentication and admin privileges
router.post('/', isAdmin, upload.single('image'), barberController.createBarber);
router.put('/:id', isAdmin, upload.single('image'), barberController.updateBarber);
router.delete('/:id', isAdmin, barberController.deleteBarber);

module.exports = router;

