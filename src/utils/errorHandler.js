const logger = require('./logger');

class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleError = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized: Invalid or missing authentication';
    errorCode = 'UNAUTHORIZED';
  } else if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Resource already exists';
    errorCode = 'DUPLICATE_RESOURCE';
  }
  
  if (statusCode === 500) {
    logger.error({
      message: `${req.method} ${req.originalUrl} - ${err.message}`,
      error: err,
      stack: err.stack,
      requestId: req.id
    });
  } else {
    logger.warn({
      message: `${req.method} ${req.originalUrl} - ${err.message}`,
      statusCode,
      requestId: req.id
    });
  }
  
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message
    }
  });
};

module.exports = {
  AppError,
  handleError
};