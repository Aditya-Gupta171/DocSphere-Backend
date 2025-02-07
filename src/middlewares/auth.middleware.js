import jwt from 'jsonwebtoken';
import TokenBlacklist from '../models/token.model.js';
import User from '../models/user.model.js';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Check blacklist
    const blacklistedToken = await TokenBlacklist.findOne({ token });
    if (blacklistedToken) {
      return res.status(401).json({ message: 'Token has been revoked' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Try refresh token
        const refreshToken = req.headers['x-refresh-token'];
        if (!refreshToken) {
          return res.status(401).json({ message: 'Token expired' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }

        // Generate new access token
        const newToken = jwt.sign(
          { id: user._id },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.setHeader('x-new-token', newToken);
        req.user = user;
        next();
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default authMiddleware;