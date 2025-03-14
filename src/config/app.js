const path = require('path');

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  corsOptions: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Request-ID'],
    credentials: true,
    maxAge: 86400
  },
  rateLimiter: {
    windowMs: 15 * 60 * 1000,
    max: 100
  },
  security: {
    enableCORS: true,
    enableHelmet: true,
    enableRateLimiter: true,
    enableCompression: true
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: path.join(process.cwd(), 'logs')
  },
  pagination: {
    defaultLimit: 10,
    maxLimit: 100
  }
};