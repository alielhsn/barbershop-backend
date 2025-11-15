// barbershopfourr/server/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT token
exports.authenticateToken = (req, res, next) => {
  //console.log('Authenticating token...');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  //console.log('Token found:', !!token);
  //console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  
  if (!token) {
    //console.log('No token provided');
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      //console.log('Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    //console.log('Token verified for user:', user);
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  //console.log('Checking admin status...');
  
  // First ensure the user is authenticated
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    //console.log('No token provided for admin check');
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      //console.log('Token verification failed for admin check:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Check if user is admin
    //console.log('User admin status:', user.isAdmin);
    if (user.isAdmin) {
      req.user = user;
      return next();
    }
    
    //console.log('User is not admin');
    res.status(403).json({ error: 'Admin access required' });
  });
};