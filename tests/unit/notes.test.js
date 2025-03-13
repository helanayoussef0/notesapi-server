const NotesService = require('../../src/api/services/notesService');
const NoteModel = require('../../src/api/models/note');
const UserModel = require('../../src/api/models/user');
const { AppError } = require('../../src/utils/errorHandler');

jest.mock('../../src/api/models/note');
jest.mock('../../src/api/models/user');
jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}));

describe('Notes Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createNote', () => {
    it('should create a note successfully', async () => {
      const userId = 1;
      const noteData = {
        title: 'Test Note',
        content: 'This is a test note',
        is_archived: false
      };
      
      const createdNote = {
        id: 1,
        user_id: userId,
        title: noteData.title,
        content: noteData.content,
        is_archived: noteData.is_archived,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      NoteModel.createNote.mockResolvedValue(createdNote);
      
      const result = await NotesService.createNote(userId, noteData);
      
      expect(NoteModel.createNote).toHaveBeenCalledWith(userId, noteData);
      expect(result).toEqual(createdNote);
    });
    
    it('should handle errors during note creation', async () => {
      const userId = 1;
      const noteData = {
        title: 'Test Note',
        content: 'This is a test note'
      };
      
      const error = new Error('Database error');
      NoteModel.createNote.mockRejectedValue(error);
      
      await expect(NotesService.createNote(userId, noteData)).rejects.toThrow(error);
    });
  });
  
  describe('getNotes', () => {
    it('should get all notes for a user', async () => {
      const userId = 1;
      const options = {
        archived: false,
        page: 1,
        limit: 10
      };
      
      const notesResponse = {
        notes: [
          {
            id: 1,
            user_id: userId,
            title: 'Note 1',
            content: 'Content 1',
            is_archived: false
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1
        }
      };
      
      NoteModel.getNotesByUser.mockResolvedValue(notesResponse);
      
      const result = await NotesService.getNotes(userId, options);
      
      expect(NoteModel.getNotesByUser).toHaveBeenCalledWith(userId, options);
      expect(result).toEqual(notesResponse);
    });
  });
  
  describe('getNoteById', () => {
    it('should get a note by ID', async () => {
      const noteId = 1;
      const userId = 1;
      
      const note = {
        id: noteId,
        user_id: userId,
        title: 'Test Note',
        content: 'This is a test note',
        is_archived: false
      };
      
      NoteModel.getNoteById.mockResolvedValue(note);
      
      const result = await NotesService.getNoteById(noteId, userId);
      
      expect(NoteModel.getNoteById).toHaveBeenCalledWith(noteId, userId);
      expect(result).toEqual(note);
    });
    
    it('should handle not found note', async () => {
      const noteId = 999;
      const userId = 1;
      
      const error = new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
      NoteModel.getNoteById.mockRejectedValue(error);
      
      await expect(NotesService.getNoteById(noteId, userId)).rejects.toThrow(error);
    });
  });
  
  describe('updateNote', () => {
    it('should update a note successfully', async () => {
      const noteId = 1;
      const userId = 1;
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content'
      };
      
      const updatedNote = {
        id: noteId,
        user_id: userId,
        title: updateData.title,
        content: updateData.content,
        is_archived: false,
        updated_at: new Date().toISOString()
      };
      
      NoteModel.updateNote.mockResolvedValue(updatedNote);
      
      const result = await NotesService.updateNote(noteId, userId, updateData);
      
      expect(NoteModel.updateNote).toHaveBeenCalledWith(noteId, userId, updateData);
      expect(result).toEqual(updatedNote);
    });
  });
  
  describe('deleteNote', () => {
    it('should delete a note successfully', async () => {
      const noteId = 1;
      const userId = 1;
      
      NoteModel.deleteNote.mockResolvedValue(true);
      
      const result = await NotesService.deleteNote(noteId, userId);
      
      expect(NoteModel.deleteNote).toHaveBeenCalledWith(noteId, userId);
      expect(result).toBe(true);
    });
  });
  
  describe('shareNote', () => {
    it('should share a note with another user', async () => {
      const noteId = 1;
      const userId = 1;
      const sharedWithEmail = 'share@example.com';
      
      const sharedWithUser = {
        id: 2,
        email: sharedWithEmail
      };
      
      const shareResult = {
        note_id: noteId,
        shared_with: sharedWithUser
      };
      
      UserModel.findUserByEmail.mockResolvedValue(sharedWithUser);
      NoteModel.shareNote.mockResolvedValue(shareResult);
      
      const result = await NotesService.shareNote(noteId, userId, sharedWithEmail);
      
      expect(UserModel.findUserByEmail).toHaveBeenCalledWith(sharedWithEmail);
      expect(NoteModel.shareNote).toHaveBeenCalledWith(noteId, userId, sharedWithUser.id);
      expect(result).toEqual(shareResult);
    });
    
    it('should prevent sharing with self', async () => {
      const noteId = 1;
      const userId = 1;
      const sharedWithEmail = 'self@example.com';
      
      const sharedWithUser = {
        id: userId,
        email: sharedWithEmail
      };
      
      UserModel.findUserByEmail.mockResolvedValue(sharedWithUser);
      
      await expect(NotesService.shareNote(noteId, userId, sharedWithEmail))
        .rejects
        .toThrow(new AppError('Cannot share note with yourself', 400, 'INVALID_SHARE'));
    });
  });
  
  describe('searchNotes', () => {
    it('should search notes successfully', async () => {
      const userId = 1;
      const query = 'test';
      const options = {
        page: 1,
        limit: 10
      };
      
      const searchResults = {
        notes: [
          {
            id: 1,
            user_id: userId,
            title: 'Test Note',
            content: 'This is a test note'
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1
        }
      };
      
      NoteModel.searchNotes.mockResolvedValue(searchResults);
      
      const result = await NotesService.searchNotes(userId, query, options);
      
      expect(NoteModel.searchNotes).toHaveBeenCalledWith(userId, query, options);
      expect(result).toEqual(searchResults);
    });
    
    it('should validate search query length', async () => {
      const userId = 1;
      const query = '';
      const options = {
        page: 1,
        limit: 10
      };
      
      await expect(NotesService.searchNotes(userId, query, options))
        .rejects
        .toThrow(new AppError('Search query must be at least 2 characters', 400, 'INVALID_QUERY'));
    });
  });
});