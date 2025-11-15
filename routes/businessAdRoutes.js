// barbershopfourr/server/routes/businessAdRoutes.js
const express = require('express');
const businessAdController = require('../controllers/businessAdController');
const upload = require('../middlewares/upload');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

// Public route - no authentication required
router.get('/', businessAdController.getBusinessAds);

// Apply authentication middleware to admin routes only
router.use(authenticateToken);

// Apply admin middleware to routes that need admin access
router.get('/all', isAdmin, businessAdController.getAllBusinessAds);
router.post('/', upload.array('images', 3), isAdmin, businessAdController.createBusinessAd);
router.put('/:id', upload.array('images', 3), isAdmin, businessAdController.updateBusinessAd);
router.delete('/:id', isAdmin, businessAdController.deleteBusinessAd);
router.put('/:id/toggle', isAdmin, businessAdController.toggleBusinessAdStatus);

module.exports = router;

