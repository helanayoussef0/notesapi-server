const request = require('supertest');
const { app } = require('../../src/app');
const { db } = require('../../src/config/database');

let server;
const TEST_PORT = 3002;

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    try {
      await db.migrate.rollback(null, true);
    } catch (error) {
      console.log('Migration rollback error:', error.message);
    }
    
    try {
      await db.migrate.latest();
    } catch (error) {
      console.log('Migration latest error:', error.message);
    }
    
    server = app.listen(TEST_PORT);
  });

  afterAll(async () => {
    await db.migrate.rollback();
    await db.destroy();
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  beforeEach(async () => {
    await db.raw('SET FOREIGN_KEY_CHECKS = 0');
    await db('shared_notes').truncate();
    await db('notes').truncate();
    await db('users').truncate();
    await db.raw('SET FOREIGN_KEY_CHECKS = 1');
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      const res = await request(server)
        .post('/api/auth/signup')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123!',
          full_name: 'Test User'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('username', 'testuser');
    });

    it('should not allow duplicate emails', async () => {
      await request(server)
        .post('/api/auth/signup')
        .send({
          username: 'testuser1',
          email: 'test@example.com',
          password: 'Password123!',
          full_name: 'Test User 1'
        });

      const res = await request(server)
        .post('/api/auth/signup')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'Password123!',
          full_name: 'Test User 2'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.code).toBe('EMAIL_IN_USE');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(server)
        .post('/api/auth/signup')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123!',
          full_name: 'Test User'
        });
    });

    it('should login existing user', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should not login with incorrect password', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should not login with non-existent email', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });
  });
});