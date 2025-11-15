// barbershopfourr/server/controllers/authController.js
const jwt = require('jsonwebtoken');

// Generate access token (short-lived)
const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      firstName: user.firstName, 
      lastName: user.lastName, 
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin 
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // 15 minutes
  );
};

// Generate refresh token (long-lived)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin 
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' } // 7 days
  );
};

exports.login = async (req, res) => {
  const { firstName, lastName, phoneNumber } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;
  
  try {
    // Check if the user is an admin based on special credentials
    const isAdmin = (
      firstName.toLowerCase() === process.env.ADMIN_FIRST_NAME.toLowerCase() && 
      lastName.toLowerCase() === process.env.ADMIN_LAST_NAME.toLowerCase() && 
      phoneNumber === process.env.ADMIN_PHONE_NUMBER
    );
    
    // Generate both tokens
    const accessToken = generateAccessToken({ firstName, lastName, phoneNumber, isAdmin });
    const refreshToken = generateRefreshToken({ firstName, lastName, phoneNumber, isAdmin });
    
    // Return response with both tokens and user info
    res.json({
      accessToken,
      refreshToken,
      isAdmin,
      user: {
        fullName: `${firstName} ${lastName}`,
        phoneNumber
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    // Generate new access token
    const newAccessToken = generateAccessToken({
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      phoneNumber: decoded.phoneNumber,
      isAdmin: decoded.isAdmin
    });
    
    res.json({
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    // If we get here, the token is valid (authenticateToken middleware already verified it)
    res.json({ valid: true, user: req.user });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ valid: false });
  }
};
