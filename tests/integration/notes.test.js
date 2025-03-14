const request = require('supertest');
const { app } = require('../../src/app');
const { db } = require('../../src/config/database');

let server;
const TEST_PORT = 3003;

describe('Notes Endpoints', () => {
  let authToken;

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
    
    const res = await request(server)
      .post('/api/auth/signup')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'Test User'
      });
    
    authToken = res.body.data.token;
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
    
    const res = await request(server)
      .post('/api/auth/signup')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'Test User'
      });
    
    authToken = res.body.data.token;
  });

  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const res = await request(server)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Note',
          content: 'This is a test note'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.note).toHaveProperty('title', 'Test Note');
    });

    it('should not create note without authentication', async () => {
      const res = await request(server)
        .post('/api/notes')
        .send({
          title: 'Test Note',
          content: 'This is a test note'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });
  });

  describe('GET /api/notes', () => {
    beforeEach(async () => {
      await request(server)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Note',
          content: 'This is a test note'
        });
    });

    it('should return all notes for the user', async () => {
      const res = await request(server)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data.notes)).toBe(true);
      expect(res.body.data.notes).toHaveLength(1);
    });

    it('should not return notes without authentication', async () => {
      const res = await request(server)
        .get('/api/notes');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });
  });
});