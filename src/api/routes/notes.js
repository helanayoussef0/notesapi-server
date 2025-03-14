const express = require('express');
const Joi = require('joi');
const NotesController = require('../controllers/notesController');
const { validate } = require('../middlewares/validator');
const { authenticate } = require('../middlewares/auth');
const { searchLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.use(authenticate);

const createNoteSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(1).max(255).required(),
    content: Joi.string().required(),
    is_archived: Joi.boolean().optional()
  })
};

const updateNoteSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(1).max(255).optional(),
    content: Joi.string().optional(),
    is_archived: Joi.boolean().optional()
  }).min(1),
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

const noteIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

const shareNoteSchema = {
  body: Joi.object({
    email: Joi.string().trim().email().required()
  }),
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

const searchSchema = {
  query: Joi.object({
    q: Joi.string().trim().min(2).required(),
    page: Joi.number().integer().positive().optional(),
    limit: Joi.number().integer().positive().max(100).optional()
  })
};

const getNotesSchema = {
  query: Joi.object({
    archived: Joi.boolean().optional(),
    page: Joi.number().integer().positive().optional(),
    limit: Joi.number().integer().positive().max(100).optional()
  })
};

router.get('/', validate(getNotesSchema), NotesController.getNotes);
router.get('/search', searchLimiter, validate(searchSchema), NotesController.searchNotes);
router.get('/:id', validate(noteIdSchema), NotesController.getNoteById);
router.post('/', validate(createNoteSchema), NotesController.createNote);
router.put('/:id', validate(updateNoteSchema), NotesController.updateNote);
router.delete('/:id', validate(noteIdSchema), NotesController.deleteNote);
router.post('/:id/share', validate(shareNoteSchema), NotesController.shareNote);

module.exports = router;