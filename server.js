/*
barbershopfourr/
├── .env                           
├── .env.example                    
├── .gitignore
├── node_modules/
├── package.json                    
├── package-lock.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
├── public/
│   ├── favicon.ico
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
├── server/                         
│   ├── config/
│   │   ├── db.js                  
│   │   └── emailConfig.js         
│   ├── controllers/
│   │   ├── adController.js
│   │   ├── appointmentController.js
│   │   ├── authController.js
│   │   ├── barberController.js
│   │   ├── blockedSlotsController.js
│   │   ├── businessAdController.js
│   │   ├── productController.js
│   │   └── serviceController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   └── upload.js
│   │   └── securityMiddleware.js
│   ├── routes/
│   │   ├── adRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── authRoutes.js
│   │   ├── barberRoutes.js
│   │   ├── blockedSlotsRoutes.js
│   │   ├── businessAdRoutes.js
│   │   ├── productRoutes.js
│   │   ├── serviceRoutes.js
│   │   └── upload.js
│   ├── uploads/
│   │   ├── ads/
│   │   ├── barbers/
│   │   ├── business_ads/
│   │   ├── products/
│   │   └── services/
│   ├── package.json                
│   ├── package-lock.json
│   └── server.js                   
└── src/                           
    ├── components/
    │   ├── assets/                 
    │   ├── Auth/
    │   │   ├── AuthForm.js
    │   │   └── AuthPage.js
    │   ├── AdBanner.js
    │   ├── AdminDashboard.js
    │   ├── AppointmentList.js
    │   ├── AppointmentsAnalyzer.js
    │   ├── Barbers.js
    │   ├── BookingForm.js
    │   ├── BusinessAdBanner.js
    │   ├── CombinedBanner.js
    │   ├── ConfirmationModal.js
    │   ├── Footer.js
    │   ├── Header.js
    │   ├── Hero.js
    │   ├── LanguageToggle.js
    │   ├── LoadingSpinner.js
    │   ├── ProductDetailPage.js
    │   ├── Products.js
    │   ├── Services.js
    │   ├── SingleProductPage.js
    │   └── ToastNotification.js
    ├── context/
    │   └── ToastContext.js
    ├── Utils/
    │   ├── auth.js
    │   ├── availableTimes.js
    │   ├── scroll.js
    │   └── timeUtils.js
    ├── App.css
    ├── App.js
    ├── AppTest.js
    ├── index.css
    ├── index.js
    ├── reportWebVitals.js
    ├── setupTest.js
    └── translations.js
    */


//barbershopfourr/server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const moment = require('moment-timezone');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Load environment variables from root .env (only once)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('./config/db');
const cron = require('node-cron');
const { cleanupPastAppointments } = require('./controllers/appointmentController');
const { cleanupPastBlockedSlots } = require('./controllers/blockedSlotsController');

// Import routes
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const productRoutes = require('./routes/productRoutes');
const barberRoutes = require('./routes/barberRoutes');
const uploadRoutes = require('./routes/upload');
const blockedSlotsRoutes = require('./routes/blockedSlotsRoutes');
const adRoutes = require('./routes/adRoutes');
const businessAdRoutes = require('./routes/businessAdRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ========== SECURITY MIDDLEWARE ==========
// Add Helmet with minimal configuration
app.use(helmet({
  // Disable contentSecurityPolicy for now to avoid breaking your app
  contentSecurityPolicy: false,
  
  // Keep these enabled for basic security
  crossOriginEmbedderPolicy: false, // Disable if you have embedded content
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources
}));

// Configure specific security headers manually for better control
app.use(helmet.xssFilter()); // XSS protection
app.use(helmet.noSniff()); // Prevent MIME type sniffing
app.use(helmet.ieNoOpen()); // Prevent IE from executing downloads
app.use(helmet.hidePoweredBy()); // Remove X-Powered-By header

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser()); // Added cookie-parser middleware

// Add this after the CORS middleware
/*app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});*/

// Debug middleware for all requests
/*app.use((req, res, next) => {
  console.log('=== INCOMING REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  console.log('=======================');
  next();
});*/

// Rate limiting for admin login
const adminLoginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Only 3 attempts for admin login
  message: { 
    error: 'Too many admin login attempts. Please try again after 15 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Apply rate limiting to auth routes
app.use('/api/auth/login', adminLoginRateLimit);

app.use("/api", require("./routes/initDb"));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/blocked-slots', blockedSlotsRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Also serve static files from each subdirectory
app.use('/uploads/services', express.static(path.join(__dirname, 'uploads/services')));
app.use('/uploads/products', express.static(path.join(__dirname, 'uploads/products')));
app.use('/uploads/barbers', express.static(path.join(__dirname, 'uploads/barbers')));
app.use('/api/ads', adRoutes);
app.use('/api/business-ads', businessAdRoutes);
app.use('/uploads/business_ads', express.static(path.join(__dirname, 'uploads/business_ads')));

//console.log('=== ROUTE REGISTRATION DEBUG ===');
//console.log('Ad routes registered:', adRoutes.stack ? adRoutes.stack.length : 'No routes');
//console.log('Business ad routes registered:', businessAdRoutes.stack ? businessAdRoutes.stack.length : 'No routes');

// Log all registered routes for ads
if (adRoutes.stack) {
  //console.log('Ad routes:');
  adRoutes.stack.forEach(layer => {
    if (layer.route) {
      //console.log(`  ${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`);
    }
  });
}

// Log all registered routes for business ads
if (businessAdRoutes.stack) {
  //console.log('Business ad routes:');
  businessAdRoutes.stack.forEach(layer => {
    if (layer.route) {
      //console.log(`  ${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`);
    }
  });
}
//console.log('==============================');

// Test endpoint - NO ALIASES
app.get('/api/test', async (req, res) => {
  try {
    const [result] = await db.query('SELECT NOW()');
    res.json({ 
      message: 'MySQL Database connection successful!',
      time: result[0]['NOW()'] 
    });
  } catch (err) {
    console.error('Database test error:', err);
    res.status(500).json({ error: 'Database connection failed: ' + err.message });
  }
});

// Simple test endpoint for barbers
app.get('/api/barbers/test', (req, res) => {
  res.json({ message: 'Barbers endpoint is working!' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Replace the CronJob constructor with node-cron syntax
const cleanupJob = cron.schedule('0 23 * * *', async function() {
    const beirutTime = moment().tz('Asia/Beirut').format('YYYY-MM-DD HH:mm:ss');
    //console.log('Running scheduled appointment cleanup at Beirut time:', beirutTime);
    
    try {
        const deletedAppointments = await cleanupPastAppointments();
        //console.log(`Scheduled cleanup completed. Deleted ${deletedAppointments.length} past appointments.`);
    } catch (error) {
        console.error('Scheduled appointment cleanup failed:', error);
    }
    
    //console.log('Running scheduled blocked slots cleanup...');
    try {
        const deletedBlockedSlots = await cleanupPastBlockedSlots();
        //console.log(`Scheduled blocked slots cleanup completed. Deleted ${deletedBlockedSlots.length} past blocked slots.`);
    } catch (error) {
        console.error('Scheduled blocked slots cleanup failed:', error);
    }
}, {
    scheduled: true,
    timezone: 'Asia/Beirut'
});
// Start the cron job
cleanupJob.start();
//console.log('Scheduled appointment cleanup initialized (runs daily at 12:05 AM Beirut time)');

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

});
