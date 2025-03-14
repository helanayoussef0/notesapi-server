const AuthService = require('../../src/api/services/authService');
const UserModel = require('../../src/api/models/user');
const { generateToken, comparePassword } = require('../../src/config/auth');
const { AppError } = require('../../src/utils/errorHandler');

jest.mock('../../src/api/models/user');
jest.mock('../../src/config/auth');
jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}));

describe('Authentication Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        full_name: 'Test User'
      };
      
      const createdUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        created_at: new Date().toISOString()
      };
      
      const token = 'mock-jwt-token';
      
      UserModel.createUser.mockResolvedValue(createdUser);
      generateToken.mockReturnValue(token);
      
      const result = await AuthService.register(userData);
      
      expect(UserModel.createUser).toHaveBeenCalledWith(userData);
      expect(generateToken).toHaveBeenCalledWith({
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email
      });
      
      expect(result).toEqual({
        user: createdUser,
        token
      });
    });
    
    it('should handle registration errors', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      };
      
      const error = new AppError('Email already in use', 409, 'EMAIL_IN_USE');
      
      UserModel.createUser.mockRejectedValue(error);
      
      await expect(AuthService.register(userData)).rejects.toThrow(error);
    });
  });
  
  describe('login', () => {
    it('should login a user successfully', async () => {
      const email = 'test@example.com';
      const password = 'Password123';
      
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed-password',
        is_active: true
      };
      
      const token = 'mock-jwt-token';
      
      UserModel.findUserByEmail.mockResolvedValue(user);
      comparePassword.mockResolvedValue(true);
      generateToken.mockReturnValue(token);
      
      const result = await AuthService.login(email, password);
      
      expect(UserModel.findUserByEmail).toHaveBeenCalledWith(email);
      expect(comparePassword).toHaveBeenCalledWith(password, user.password);
      expect(generateToken).toHaveBeenCalledWith({
        id: user.id,
        username: user.username,
        email: user.email
      });
      
      expect(result.user).not.toHaveProperty('password');
      expect(result.token).toBe(token);
    });
    
    it('should reject login with invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'WrongPassword';
      
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed-password',
        is_active: true
      };
      
      UserModel.findUserByEmail.mockResolvedValue(user);
      comparePassword.mockResolvedValue(false);
      
      await expect(AuthService.login(email, password))
        .rejects
        .toThrow(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
    });
    
    it('should reject login for inactive accounts', async () => {
      const email = 'test@example.com';
      const password = 'Password123';
      
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed-password',
        is_active: false
      };
      
      UserModel.findUserByEmail.mockResolvedValue(user);
      
      await expect(AuthService.login(email, password))
        .rejects
        .toThrow(new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED'));
    });
  });
});