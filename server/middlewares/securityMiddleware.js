//barbershopfourr/server/middlewares/securityMiddleware.js
const adminLoginAttempts = new Map();
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes

// Cleanup function to remove old entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of adminLoginAttempts.entries()) {
    if (now - data.timestamp > BLOCK_DURATION) {
      adminLoginAttempts.delete(ip);
    }
  }
}, 60 * 1000); // Clean every minute

exports.checkAdminLoginAttempts = (req, res, next) => {
  const { firstName, lastName } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Check if this is an admin attempt
  const isAdminAttempt = (
    firstName && 
    lastName &&
    firstName.toLowerCase() === process.env.ADMIN_FIRST_NAME.toLowerCase() && 
    lastName.toLowerCase() === process.env.ADMIN_LAST_NAME.toLowerCase()
  );
  
  if (!isAdminAttempt) {
    return next(); // Not an admin attempt, proceed normally
  }
  
  const now = Date.now();
  const attemptData = adminLoginAttempts.get(clientIP);
  
  // Check if IP is blocked
  if (attemptData && attemptData.blockedUntil > now) {
    const remainingTime = Math.ceil((attemptData.blockedUntil - now) / 1000 / 60);
    //console.log(`🚫 BLOCKED ADMIN LOGIN ATTEMPT - IP: ${clientIP} - Blocked for ${remainingTime} more minutes`);
    
    return res.status(429).json({ 
      error: `Too many admin login attempts. Please try again in ${remainingTime} minutes.` 
    });
  }
  
  // Reset attempts if block period has expired
  if (attemptData && attemptData.blockedUntil <= now) {
    adminLoginAttempts.delete(clientIP);
  }
  
  next();
};

exports.recordAdminLoginAttempt = (req, res, next) => {
  const { firstName, lastName, phoneNumber } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Check if this is an admin attempt
  const isAdminAttempt = (
    firstName && 
    lastName &&
    firstName.toLowerCase() === process.env.ADMIN_FIRST_NAME.toLowerCase() && 
    lastName.toLowerCase() === process.env.ADMIN_LAST_NAME.toLowerCase()
  );
  
  if (!isAdminAttempt) {
    return next(); // Not an admin attempt
  }
  
  const isSuccessful = phoneNumber === process.env.ADMIN_PHONE_NUMBER;
  const attemptData = adminLoginAttempts.get(clientIP) || { 
    attempts: 0, 
    timestamp: Date.now(),
    blockedUntil: 0
  };
  
  if (isSuccessful) {
    // Reset on successful login
    adminLoginAttempts.delete(clientIP);
    //console.log(`✅ ADMIN LOGIN SUCCESS - IP: ${clientIP} - Attempts reset`);
  } else {
    // Increment failed attempts
    attemptData.attempts += 1;
    attemptData.timestamp = Date.now();
    
    //console.log(`❌ ADMIN LOGIN FAILED - IP: ${clientIP} - Attempt ${attemptData.attempts}/3`);
    
    // Block after 3 failed attempts
    if (attemptData.attempts >= 3) {
      attemptData.blockedUntil = Date.now() + BLOCK_DURATION;
      //console.log(`🔒 IP BLOCKED - ${clientIP} - Blocked until: ${new Date(attemptData.blockedUntil).toISOString()}`);
    }
    
    adminLoginAttempts.set(clientIP, attemptData);
  }
  
  next();
};