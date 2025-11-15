//barbershopfourr/server/routes/productRoutes.js
const express = require('express');
const productController = require('../controllers/productController');
const upload = require('../middlewares/upload');
const { isAdmin } = require('../middlewares/authMiddleware'); // Import admin middleware
const router = express.Router();

// Public route - no authentication required to get products
router.get('/', productController.getProducts);

// Admin-only routes - require authentication and admin privileges
router.post('/', isAdmin, upload.single('image'), productController.createProduct);
router.delete('/:id', isAdmin, productController.deleteProduct);
router.put('/:id', isAdmin, upload.single('image'), productController.updateProduct);

module.exports = router;

