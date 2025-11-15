//barbershopfourr/server/routes/serviceRoutes.js
const express = require('express');
const serviceController = require('../controllers/serviceController');
const upload = require('../middlewares/upload');
const { isAdmin } = require('../middlewares/authMiddleware'); // Import admin middleware
const router = express.Router();

// Public route - no authentication required to get services
router.get('/', serviceController.getServices);

// Admin-only routes - require authentication and admin privileges
router.post('/', isAdmin, upload.single('image'), serviceController.createService);
router.delete('/:id', isAdmin, serviceController.deleteService);
router.put('/:id', isAdmin, upload.single('image'), serviceController.updateService);

module.exports = router;

