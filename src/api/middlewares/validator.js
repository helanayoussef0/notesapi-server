const Joi = require('joi');
const { AppError } = require('../../utils/errorHandler');

const validate = (schema) => {
  return (req, res, next) => {
    const { body, query, params } = schema;
    const validationErrors = {};
    
    if (body && Object.keys(req.body).length) {
      const { error } = body.validate(req.body, { abortEarly: false });
      if (error) {
        validationErrors.body = error.details.map(err => ({
          message: err.message,
          path: err.path
        }));
      }
    }
    
    if (query && Object.keys(req.query).length) {
      const { error } = query.validate(req.query, { abortEarly: false });
      if (error) {
        validationErrors.query = error.details.map(err => ({
          message: err.message,
          path: err.path
        }));
      }
    }
    
    if (params && Object.keys(req.params).length) {
      const { error } = params.validate(req.params, { abortEarly: false });
      if (error) {
        validationErrors.params = error.details.map(err => ({
          message: err.message,
          path: err.path
        }));
      }
    }
    
    if (Object.keys(validationErrors).length) {
      return next(new AppError('Validation error', 400, 'VALIDATION_ERROR'));
    }
    
    next();
  };
};

module.exports = {
  validate
};