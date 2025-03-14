const { verifyToken } = require('../../config/auth');
const { AppError } = require('../../utils/errorHandler');
const { db } = require('../../config/database');
const logger = require('../../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AppError('Invalid authentication token', 401, 'INVALID_TOKEN');
    }
    
    const decoded = verifyToken(token);
    
    const user = await db('users')
      .where({ id: decoded.id })
      .select('id', 'username', 'email', 'is_active')
      .first();
    
    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }
    
    if (!user.is_active) {
      throw new AppError('User account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }
    
    req.user = user;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid authentication token', 401, 'INVALID_TOKEN'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Authentication token expired', 401, 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
};

module.exports = {
  authenticate
};