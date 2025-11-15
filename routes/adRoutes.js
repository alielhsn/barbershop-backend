// barbershopfourr/server/routes/adRoutes.js
const express = require('express');
const adController = require('../controllers/adController');
const upload = require('../middlewares/upload');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

// Public route - no authentication required
router.get('/', adController.getAds);

// Apply authentication middleware to admin routes only
router.use(authenticateToken);

// Apply admin middleware to routes that need it
router.post('/', upload.single('image'), isAdmin, adController.createAd);
router.put('/:id', upload.single('image'), isAdmin, adController.updateAd);
router.delete('/:id', isAdmin, adController.deleteAd);
router.put('/:id/toggle', isAdmin, adController.toggleAdStatus);

module.exports = router;

