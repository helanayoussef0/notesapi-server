const express = require('express');
const Joi = require('joi');
const AuthController = require('../controllers/authController');
const { validate } = require('../middlewares/validator');
const { authenticate } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

const registerSchema = {
  body: Joi.object({
    username: Joi.string().trim().min(3).max(50).required()
      .pattern(/^[a-zA-Z0-9_]+$/)
      .message('Username must contain only alphanumeric characters and underscores'),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(8).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
      .message('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    full_name: Joi.string().trim().max(100).optional()
  })
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required()
  })
};

router.post('/signup', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.get('/profile', authenticate, AuthController.getProfile);

module.exports = router;