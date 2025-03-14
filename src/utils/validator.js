const Joi = require('joi');

const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;
const usernameRegex = /^[a-zA-Z0-9_]+$/;

const schemas = {
  id: Joi.number().integer().positive().required(),
  
  pagination: Joi.object({
    page: Joi.number().integer().positive().default(1),
    limit: Joi.number().integer().positive().max(100).default(10)
  }),
  
  loginPayload: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required()
  }),
  
  registrationPayload: Joi.object({
    username: Joi.string().trim().min(3).max(50).required()
      .pattern(usernameRegex),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(8).required()
      .pattern(passwordComplexityRegex),
    full_name: Joi.string().trim().max(100).optional()
  }),
  
  createNotePayload: Joi.object({
    title: Joi.string().trim().min(1).max(255).required(),
    content: Joi.string().required(),
    is_archived: Joi.boolean().optional()
  }),
  
  updateNotePayload: Joi.object({
    title: Joi.string().trim().min(1).max(255).optional(),
    content: Joi.string().optional(),
    is_archived: Joi.boolean().optional()
  }).min(1),
  
  shareNotePayload: Joi.object({
    email: Joi.string().trim().email().required()
  }),
  
  searchQuery: Joi.object({
    q: Joi.string().trim().min(2).required(),
    page: Joi.number().integer().positive().optional(),
    limit: Joi.number().integer().positive().max(100).optional()
  })
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePasswordStrength = (password) => {
  if (password.length < 8) return false;
  return passwordComplexityRegex.test(password);
};

const sanitize = (obj) => {
  const sanitized = { ...obj };
  
  if (sanitized.password) {
    delete sanitized.password;
  }
  
  return sanitized;
};

module.exports = {
  schemas,
  validateEmail,
  validatePasswordStrength,
  sanitize
};