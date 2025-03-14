const request = require('supertest');
const { app } = require('../../src/app');
const { db } = require('../../src/config/database');

describe('API End-to-End Tests', () => {
  let authToken;
  let noteId;
  let server;
  const TEST_PORT = 3004;
  
  beforeAll(async () => {
    server = app.listen(TEST_PORT);
    
    try {
      await db.migrate.rollback(null, true);
      await db.migrate.latest();
    } catch (error) {
      console.error('Migration error:', error);
    }
    
    const testUser = {
      username: 'e2etest',
      email: 'e2e@example.com',
      password: 'TestPassword123',
      full_name: 'E2E Test User'
    };
    
    try {
      const response = await request(server)
        .post('/api/auth/signup')
        .send(testUser);
      
      if (!response.body.success) {
        console.error('Failed to create test user:', response.body);
        throw new Error('Failed to create test user');
      }
      
      authToken = response.body.data.token;
    } catch (error) {
      console.error('Error setting up test user:', error);
      throw error;
    }
  });
  
  afterAll(async () => {
    try {
      await db.migrate.rollback();
      await db.destroy();
      if (server) {
        await new Promise(resolve => server.close(resolve));
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  beforeEach(async () => {
    if (expect.getState().currentTestName.includes('Note Sharing Flow')) {
      return;
    }
    
    try {
      await db.raw('SET FOREIGN_KEY_CHECKS = 0');
      await db('shared_notes').truncate();
      await db('notes').truncate();
      await db.raw('SET FOREIGN_KEY_CHECKS = 1');
    } catch (error) {
      console.error('Error cleaning database:', error);
      throw error;
    }
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123',
        full_name: 'New User'
      };
      
      const response = await request(server)
        .post('/api/auth/signup')
        .send(userData);
      
      expect(response.statusCode).toBe(201);
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
      
      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData);
      
      expect(response.statusCode).toBe(200);
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
      
      const response = await request(server)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.note.title).toBe(noteData.title);
      expect(response.body.data.note.content).toBe(noteData.content);
      expect(Boolean(response.body.data.note.is_archived)).toBe(noteData.is_archived);
      
      noteId = response.body.data.note.id;
    });

    it('should get all notes', async () => {
      const response = await request(server)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.notes)).toBe(true);
    });

    it('should get a specific note', async () => {
      const createResponse = await request(server)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Note to Get',
          content: 'This note should be retrievable'
        });
      
      const noteId = createResponse.body.data.note.id;
      
      const response = await request(server)
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.note.id).toBe(noteId);
    });

    it('should update a note', async () => {
      const createResponse = await request(server)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Note to Update',
          content: 'This note will be updated'
        });
      
      const noteId = createResponse.body.data.note.id;
      
      const updateData = {
        title: 'Updated Note',
        content: 'This note has been updated',
        is_archived: true
      };
      
      const response = await request(server)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.note.title).toBe(updateData.title);
      expect(response.body.data.note.content).toBe(updateData.content);
      expect(Boolean(response.body.data.note.is_archived)).toBe(updateData.is_archived);
    });

    it('should delete a note', async () => {
      const createResponse = await request(server)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Note to Delete',
          content: 'This note will be deleted'
        });
      
      const noteId = createResponse.body.data.note.id;
      
      const response = await request(server)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      
      const getResponse = await request(server)
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(getResponse.statusCode).toBe(404);
    });
  });
  
  describe('Note Sharing Flow', () => {
    let sharedNoteId;
    let secondUserToken;
    
    it('should register a second user and create a note for sharing', async () => {
      const userData = {
        username: 'shareuser',
        email: 'share@example.com',
        password: 'Password123',
        full_name: 'Share Test User'
      };
      
      const registerResponse = await request(server)
        .post('/api/auth/signup')
        .send(userData);
      
      expect(registerResponse.statusCode).toBe(201);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data).toHaveProperty('token');
      secondUserToken = registerResponse.body.data.token;
      console.log('Second user registered with token:', secondUserToken);
      
      const noteData = {
        title: 'Note to be shared',
        content: 'This note will be shared with another user',
        is_archived: false
      };
      
      const createResponse = await request(server)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData);
      
      if (createResponse.statusCode !== 201) {
        console.log('Note creation failed:', createResponse.body);
      }
      
      expect(createResponse.statusCode).toBe(201);
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.note).toBeDefined();
      
      sharedNoteId = createResponse.body.data.note.id;
      console.log('Created note with ID:', sharedNoteId);
      
      const verifyResponse = await request(server)
        .get(`/api/notes/${sharedNoteId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(verifyResponse.statusCode).toBe(200);
      expect(verifyResponse.body.data.note.id).toBe(sharedNoteId);
    });
    
    it('should share a note with another user', async () => {
      expect(authToken).toBeDefined();
      expect(sharedNoteId).toBeDefined();
      expect(secondUserToken).toBeDefined();
      
      console.log('Attempting to share note:', {
        noteId: sharedNoteId,
        ownerToken: authToken,
        recipientEmail: 'share@example.com'
      });
      
      const checkResponse = await request(server)
        .get(`/api/notes/${sharedNoteId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(checkResponse.statusCode).toBe(200);
      expect(checkResponse.body.data.note.id).toBe(sharedNoteId);
      
      const shareData = {
        email: 'share@example.com'
      };
      
      const response = await request(server)
        .post(`/api/notes/${sharedNoteId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(shareData);
      
      if (response.statusCode !== 200) {
        console.log('Share note failed:', {
          statusCode: response.statusCode,
          body: response.body,
          noteId: sharedNoteId,
          shareData
        });
      }
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
    
    it('second user should be able to access the shared note', async () => {
      expect(secondUserToken).toBeDefined();
      expect(sharedNoteId).toBeDefined();
      
      console.log('Attempting to access shared note:', {
        noteId: sharedNoteId,
        userToken: secondUserToken
      });
      
      const response = await request(server)
        .get(`/api/notes/${sharedNoteId}`)
        .set('Authorization', `Bearer ${secondUserToken}`);
      
      if (response.statusCode !== 200) {
        console.log('Access shared note failed:', {
          statusCode: response.statusCode,
          body: response.body,
          noteId: sharedNoteId
        });
      }
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.note.id).toBe(sharedNoteId);
      expect(response.body.data.note.is_shared).toBeTruthy();
      
      const ownerResponse = await request(server)
        .get(`/api/notes/${sharedNoteId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(ownerResponse.statusCode).toBe(200);
      expect(ownerResponse.body.data.note.id).toBe(sharedNoteId);
    });
  });
  
  describe('Error Handling', () => {
    it('should reject unauthorized requests', async () => {
      const response = await request(server)
        .get('/api/notes');
      
      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_REQUIRED');
    });
    
    it('should validate inputs', async () => {
      const invalidNote = {
        title: '',
        content: 'Missing title'
      };
      
      const response = await request(server)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidNote);
      
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
    
    it('should handle not found resources', async () => {
      const response = await request(server)
        .get('/api/notes/9999')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOTE_NOT_FOUND');
    });
  });
});