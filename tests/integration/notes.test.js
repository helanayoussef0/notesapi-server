const request = require('supertest');
const app = require('../../src/app');
const { db } = require('../../src/config/database');

describe('Notes API', () => {
  let authToken;
  let noteId;
  
  beforeAll(async () => {
    await db.migrate.rollback();
    await db.migrate.latest();
    
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'notestest',
        email: 'notes@example.com',
        password: 'Password123',
        full_name: 'Notes Test User'
      });
    
    authToken = response.body.data.token;
  });
  
  afterAll(async () => {
    await db.destroy();
  });
  
  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const noteData = {
        title: 'Integration Test Note',
        content: 'This note was created during integration testing',
        is_archived: false
      };
      
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect('Content-Type', /json/)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.note).toHaveProperty('id');
      expect(response.body.data.note.title).toBe(noteData.title);
      expect(response.body.data.note.content).toBe(noteData.content);
      expect(Boolean(response.body.data.note.is_archived)).toBe(Boolean(noteData.is_archived));
      
      noteId = response.body.data.note.id;
    });
    
    it('should reject note creation without authentication', async () => {
      const noteData = {
        title: 'Unauthorized Note',
        content: 'This note should not be created'
      };
      
      const response = await request(app)
        .post('/api/notes')
        .send(noteData)
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_REQUIRED');
    });
    
    it('should validate note data', async () => {
      const invalidData = {
        title: '',
        content: 'Missing title'
      };
      
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
  
  describe('GET /api/notes', () => {
    it('should get all notes for the authenticated user', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notes');
      expect(Array.isArray(response.body.data.notes)).toBe(true);
      expect(response.body.data.notes.length).toBeGreaterThan(0);
      expect(response.body.data).toHaveProperty('pagination');
    });
    
    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/notes?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });
  });
  
  describe('GET /api/notes/:id', () => {
    it('should get a specific note by ID', async () => {
      const response = await request(app)
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.note.id).toBe(noteId);
      expect(response.body.data.note.title).toBe('Integration Test Note');
    });
    
    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .get('/api/notes/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOTE_NOT_FOUND');
    });
  });
  
  describe('PUT /api/notes/:id', () => {
    it('should update a note', async () => {
      const updateData = {
        title: 'Updated Integration Test Note',
        content: 'This note has been updated'
      };
      
      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.note.id).toBe(noteId);
      expect(response.body.data.note.title).toBe(updateData.title);
      expect(response.body.data.note.content).toBe(updateData.content);
    });
    
    it('should partially update a note', async () => {
      const updateData = {
        title: 'Partially Updated Note'
      };
      
      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.note.id).toBe(noteId);
      expect(response.body.data.note.title).toBe(updateData.title);
      expect(response.body.data.note.content).toBe('This note has been updated');
    });
  });
  
  describe('POST /api/notes/:id/share', () => {
    let sharedUserEmail;
    
    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'sharereceiver',
          email: 'receiver@example.com',
          password: 'Password123',
          full_name: 'Share Receiver'
        });
      
      sharedUserEmail = 'receiver@example.com';
    });
    
    it('should share a note with another user', async () => {
      const shareData = {
        email: sharedUserEmail
      };
      
      const response = await request(app)
        .post(`/api/notes/${noteId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(shareData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.note_id).toBe(noteId);
      expect(response.body.data.shared_with.email).toBe(sharedUserEmail);
    });
    
    it('should prevent sharing with non-existent user', async () => {
      const shareData = {
        email: 'nonexistent@example.com'
      };
      
      const response = await request(app)
        .post(`/api/notes/${noteId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(shareData)
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });
  
  describe('GET /api/notes/search', () => {
    it('should search for notes based on keywords', async () => {
      const response = await request(app)
        .get('/api/notes/search?q=updated')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notes');
      expect(Array.isArray(response.body.data.notes)).toBe(true);
    });
    
    it('should require a search query', async () => {
      const response = await request(app)
        .get('/api/notes/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_QUERY');
    });
  });
  
  describe('DELETE /api/notes/:id', () => {
    it('should delete a note', async () => {
      const response = await request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note deleted successfully');
      
      const checkResponse = await request(app)
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      expect(checkResponse.body.success).toBe(false);
    });
  });
});