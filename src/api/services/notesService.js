const NoteModel = require('../models/note');
const UserModel = require('../models/user');
const { AppError } = require('../../utils/errorHandler');
const logger = require('../../utils/logger');

const createNote = async (userId, noteData) => {
  try {
    return await NoteModel.createNote(userId, noteData);
  } catch (error) {
    logger.error(`Error creating note: ${error.message}`);
    throw error;
  }
};

const getNotes = async (userId, options) => {
  try {
    return await NoteModel.getNotesByUser(userId, options);
  } catch (error) {
    logger.error(`Error getting notes: ${error.message}`);
    throw error;
  }
};

const getNoteById = async (noteId, userId) => {
  try {
    return await NoteModel.getNoteById(noteId, userId);
  } catch (error) {
    logger.error(`Error getting note by ID: ${error.message}`);
    throw error;
  }
};

const updateNote = async (noteId, userId, noteData) => {
  try {
    return await NoteModel.updateNote(noteId, userId, noteData);
  } catch (error) {
    logger.error(`Error updating note: ${error.message}`);
    throw error;
  }
};

const deleteNote = async (noteId, userId) => {
  try {
    return await NoteModel.deleteNote(noteId, userId);
  } catch (error) {
    logger.error(`Error deleting note: ${error.message}`);
    throw error;
  }
};

const shareNote = async (noteId, userId, sharedWithEmail) => {
  try {
    const sharedWithUser = await UserModel.findUserByEmail(sharedWithEmail);
    
    if (sharedWithUser.id === userId) {
      throw new AppError('Cannot share note with yourself', 400, 'INVALID_SHARE');
    }
    
    return await NoteModel.shareNote(noteId, userId, sharedWithUser.id);
  } catch (error) {
    logger.error(`Error sharing note: ${error.message}`);
    throw error;
  }
};

const searchNotes = async (userId, query, options) => {
  try {
    if (!query || query.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400, 'INVALID_QUERY');
    }
    
    return await NoteModel.searchNotes(userId, query, options);
  } catch (error) {
    logger.error(`Error searching notes: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  shareNote,
  searchNotes
};