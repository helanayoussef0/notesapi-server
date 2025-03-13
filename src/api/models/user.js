const { db } = require('../../config/database');
const { hashPassword } = require('../../config/auth');
const { AppError } = require('../../utils/errorHandler');

const createUser = async (userData) => {
  const existingUser = await db('users')
    .where('email', userData.email)
    .orWhere('username', userData.username)
    .first();
  
  if (existingUser) {
    if (existingUser.email === userData.email) {
      throw new AppError('Email already in use', 409, 'EMAIL_IN_USE');
    }
    if (existingUser.username === userData.username) {
      throw new AppError('Username already taken', 409, 'USERNAME_TAKEN');
    }
  }
  
  const hashedPassword = await hashPassword(userData.password);
  
  const [userId] = await db('users').insert({
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
    full_name: userData.full_name || null
  });
  
  const newUser = await db('users')
    .where('id', userId)
    .select('id', 'username', 'email', 'full_name', 'created_at')
    .first();
  
  return newUser;
};

const findUserById = async (id) => {
  const user = await db('users')
    .where('id', id)
    .select('id', 'username', 'email', 'full_name', 'is_active', 'created_at')
    .first();
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  return user;
};

const findUserByEmail = async (email) => {
  const user = await db('users')
    .where('email', email)
    .first();
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  return user;
};

const findUserByUsername = async (username) => {
  const user = await db('users')
    .where('username', username)
    .first();
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  return user;
};

module.exports = {
  createUser,
  findUserById,
  findUserByEmail,
  findUserByUsername
};