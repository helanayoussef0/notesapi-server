const AuthService = require('../services/authService');
const { AppError } = require('../../utils/errorHandler');
const logger = require('../../utils/logger');

const register = async (req, res, next) => {
  try {
    const { username, email, password, full_name } = req.body;
    
    const result = await AuthService.register({
      username,
      email,
      password,
      full_name
    });
    
    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        token: result.token
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const result = await AuthService.login(email, password);
    
    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        token: result.token
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile
};