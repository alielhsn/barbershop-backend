//barbershopfourr/server/middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = {
  service: 'uploads/services',
  product: 'uploads/products',
  barber: 'uploads/barbers',
  ad: 'uploads/ads',
  business_ad: 'uploads/business_ads' // Add this line
};

// Create directories if they don't exist
Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for different types
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = '';
    
    switch (req.params.type) {
  case 'service':
    uploadPath = 'uploads/services/';
    break;
  case 'product':
    uploadPath = 'uploads/products/';
    break;
  case 'barber':
    uploadPath = 'uploads/barbers/';
    break;
  case 'ad':
    uploadPath = 'uploads/ads/';
    break;
  case 'business_ad': // Add this case
    uploadPath = 'uploads/business_ads/';
    break;
  default:
    uploadPath = 'uploads/';
}
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Increased to 10MB limit
  }
});


module.exports = upload;

