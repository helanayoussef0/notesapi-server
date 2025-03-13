const { generateToken, comparePassword } = require('../../config/auth');
const UserModel = require('../models/user');
const { AppError } = require('../../utils/errorHandler');
const logger = require('../../utils/logger');

const register = async (userData) => {
  try {
    const user = await UserModel.createUser(userData);
    
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email
    });
    
    return {
      user,
      token
    };
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    throw error;
  }
};

const login = async (email, password) => {
  try {
    const user = await UserModel.findUserByEmail(email);
    
    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }
    
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }
    
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email
    });
    
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  register,
  login
};