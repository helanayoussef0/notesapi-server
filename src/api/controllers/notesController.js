const NotesService = require('../services/notesService');
const { AppError } = require('../../utils/errorHandler');
const logger = require('../../utils/logger');

const createNote = async (req, res, next) => {
  try {
    const { title, content, is_archived } = req.body;
    const userId = req.user.id;
    
    const note = await NotesService.createNote(userId, {
      title,
      content,
      is_archived
    });
    
    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: { note }
    });
  } catch (error) {
    next(error);
  }
};

const getNotes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { archived, page, limit } = req.query;
    
    const options = {
      archived: archived === 'true',
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    };
    
    const result = await NotesService.getNotes(userId, options);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getNoteById = async (req, res, next) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const note = await NotesService.getNoteById(noteId, userId);
    
    res.status(200).json({
      success: true,
      data: { note }
    });
  } catch (error) {
    next(error);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.user.id;
    const { title, content, is_archived } = req.body;
    
    const note = await NotesService.updateNote(noteId, userId, {
      title,
      content,
      is_archived
    });
    
    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: { note }
    });
  } catch (error) {
    next(error);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.user.id;
    
    await NotesService.deleteNote(noteId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const shareNote = async (req, res, next) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.user.id;
    const { email } = req.body;
    
    if (!email) {
      throw new AppError('Email is required', 400, 'MISSING_EMAIL');
    }
    
    const result = await NotesService.shareNote(noteId, userId, email);
    
    res.status(200).json({
      success: true,
      message: 'Note shared successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const searchNotes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { q, page, limit } = req.query;
    
    if (!q) {
      throw new AppError('Search query is required', 400, 'MISSING_QUERY');
    }
    
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    };
    
    const result = await NotesService.searchNotes(userId, q, options);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
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