const rateLimit = require('express-rate-limit');
const logger = require('../../utils/logger');

const createRateLimiter = (options = {}) => {
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }

  const defaultOptions = {
    windowMs: 15 * 60 * 1000, 
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.'
      }
    },
    handler: (req, res, next, options) => {
      logger.warn({
        message: `Rate limit exceeded: ${req.method} ${req.originalUrl}`,
        ip: req.ip,
        headers: req.headers
      });
      res.status(429).json(options.message);
    }
  };

  return rateLimit({
    ...defaultOptions,
    ...options
  });
};

const globalLimiter = createRateLimiter();

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.'
    }
  }
});

const searchLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, 
  max: 30 
});

module.exports = {
  globalLimiter,
  authLimiter,
  searchLimiter
};