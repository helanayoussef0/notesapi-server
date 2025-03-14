const request = require('supertest');
const app = require('../../src/app');
const { db } = require('../../src/config/database');

describe('API End-to-End Tests', () => {
  let authToken;
  let noteId;
  
  beforeAll(async () => {
    await db.migrate.rollback();
    await db.migrate.latest();
    
    const testUser = {
      username: 'e2etest',
      email: 'e2e@example.com',
      password: 'TestPassword123',
      full_name: 'E2E Test User'
    };
    
    const registerResponse = await request(app)
      .post('/api/auth/signup')
      .send(testUser);
    
    authToken = registerResponse.body.data.token;
  });
  
  afterAll(async () => {
    await db.destroy();
  });
  
  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123',
        full_name: 'New User'
      };
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data).toHaveProperty('token');
    });
    
    it('should login successfully', async () => {
      const loginData = {
        email: 'e2e@example.com',
        password: 'TestPassword123'
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data).toHaveProperty('token');
    });
  });
  
  describe('Notes CRUD Operations', () => {
    it('should create a new note', async () => {
      const noteData = {
        title: 'E2E Test Note',
        content: 'This is a test note for E2E testing',
        is_archived: false
      };
      
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.note.title).toBe(noteData.title);
      expect(response.body.data.note.content).toBe(noteData.content);
      
      noteId = response.body.data.note.id;
    });
    
    it('should get all notes', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toBeInstanceOf(Array);
      expect(response.body.data.notes.length).toBeGreaterThanOrEqual(1);
    });
    
    it('should get a specific note by ID', async () => {
      const response = await request(app)
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.note.id).toBe(noteId);
    });
    
    it('should update a note', async () => {
      const updateData = {
        title: 'Updated E2E Test Note',
        content: 'This note has been updated during E2E testing'
      };
      
      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.note.title).toBe(updateData.title);
      expect(response.body.data.note.content).toBe(updateData.content);
    });
    
    it('should search for notes', async () => {
      const response = await request(app)
        .get('/api/notes/search?q=updated')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toBeInstanceOf(Array);
      expect(response.body.data.notes.length).toBeGreaterThanOrEqual(1);
    });
    
    it('should delete a note', async () => {
      const response = await request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      const checkResponse = await request(app)
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      expect(checkResponse.body.success).toBe(false);
    });
  });
  
  describe('Note Sharing Flow', () => {
    let sharedNoteId;
    let secondUserToken;
    
    it('should register a second user', async () => {
      const userData = {
        username: 'shareuser',
        email: 'share@example.com',
        password: 'Password123',
        full_name: 'Share Test User'
      };
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);
      
      secondUserToken = response.body.data.token;
    });
    
    it('should create a note for sharing', async () => {
      const noteData = {
        title: 'Note to be shared',
        content: 'This note will be shared with another user',
        is_archived: false
      };
      
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(201);
      
      sharedNoteId = response.body.data.note.id;
    });
    
    it('should share a note with another user', async () => {
      const shareData = {
        email: 'share@example.com'
      };
      
      const response = await request(app)
        .post(`/api/notes/${sharedNoteId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(shareData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    it('second user should be able to access the shared note', async () => {
      const response = await request(app)
        .get(`/api/notes/${sharedNoteId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.note.id).toBe(sharedNoteId);
      expect(response.body.data.note.is_shared).toBe(true);
    });
  });
  
  describe('Error Handling', () => {
    it('should reject unauthorized requests', async () => {
      const response = await request(app)
        .get('/api/notes')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_REQUIRED');
    });
    
    it('should validate inputs', async () => {
      const invalidNote = {
        title: '',
        content: 'Missing title'
      };
      
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidNote)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
    
    it('should handle not found resources', async () => {
      const response = await request(app)
        .get('/api/notes/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOTE_NOT_FOUND');
    });
  });
});