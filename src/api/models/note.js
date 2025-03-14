const { db } = require('../../config/database');
const { AppError } = require('../../utils/errorHandler');

const createNote = async (userId, noteData) => {
  const [noteId] = await db('notes').insert({
    user_id: userId,
    title: noteData.title,
    content: noteData.content,
    is_archived: noteData.is_archived || false
  });
  
  const newNote = await db('notes')
    .where('id', noteId)
    .first();
  
  return newNote;
};

const getNotesByUser = async (userId, options = {}) => {
  const { archived = false, page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;
  
  const query = db('notes')
    .where('user_id', userId)
    .andWhere('is_archived', archived)
    .orderBy('updated_at', 'desc')
    .limit(limit)
    .offset(offset);
  
  const sharedNotesQuery = db('notes')
    .join('shared_notes', 'notes.id', 'shared_notes.note_id')
    .where('shared_notes.shared_with_id', userId)
    .select('notes.*', 'shared_notes.user_id as owner_id')
    .orderBy('notes.updated_at', 'desc')
    .limit(limit)
    .offset(offset);
  
  const [notes, sharedNotes, totalCount] = await Promise.all([
    query,
    sharedNotesQuery,
    db('notes').where('user_id', userId).andWhere('is_archived', archived).count('id as count').first()
  ]);
  
  const formattedSharedNotes = sharedNotes.map(note => ({
    ...note,
    is_shared: true
  }));
  
  const allNotes = [...notes, ...formattedSharedNotes]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, limit);
  
  return {
    notes: allNotes,
    pagination: {
      total: totalCount.count,
      page,
      limit,
      pages: Math.ceil(totalCount.count / limit)
    }
  };
};

const getNoteById = async (noteId, userId) => {
  const note = await db('notes')
    .where('id', noteId)
    .andWhere('user_id', userId)
    .first();
  
  if (!note) {
    const sharedNote = await db('notes')
      .join('shared_notes', 'notes.id', 'shared_notes.note_id')
      .where('notes.id', noteId)
      .andWhere('shared_notes.shared_with_id', userId)
      .select('notes.*', 'shared_notes.user_id as owner_id')
      .first();
    
    if (!sharedNote) {
      throw new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
    }
    
    return {
      ...sharedNote,
      is_shared: true
    };
  }
  
  return note;
};

const updateNote = async (noteId, userId, noteData) => {
  const note = await db('notes')
    .where('id', noteId)
    .andWhere('user_id', userId)
    .first();
  
  if (!note) {
    throw new AppError('Note not found or you do not have permission to update it', 404, 'NOTE_NOT_FOUND');
  }
  
  await db('notes')
    .where('id', noteId)
    .update({
      ...noteData,
      updated_at: db.fn.now()
    });
  
  const updatedNote = await db('notes')
    .where('id', noteId)
    .first();
  
  return updatedNote;
};

const deleteNote = async (noteId, userId) => {
  const note = await db('notes')
    .where('id', noteId)
    .andWhere('user_id', userId)
    .first();
  
  if (!note) {
    throw new AppError('Note not found or you do not have permission to delete it', 404, 'NOTE_NOT_FOUND');
  }
  
  await db('notes')
    .where('id', noteId)
    .delete();
  
  return true;
};

const shareNote = async (noteId, userId, sharedWithId) => {
  const note = await db('notes')
    .where('id', noteId)
    .andWhere('user_id', userId)
    .first();
  
  if (!note) {
    throw new AppError('Note not found or you do not have permission to share it', 404, 'NOTE_NOT_FOUND');
  }
  
  const sharedWithUser = await db('users')
    .where('id', sharedWithId)
    .select('id', 'username', 'email')
    .first();
  
  if (!sharedWithUser) {
    throw new AppError('User to share with not found', 404, 'USER_NOT_FOUND');
  }
  
  const existingShare = await db('shared_notes')
    .where({
      note_id: noteId,
      shared_with_id: sharedWithId
    })
    .first();
  
  if (existingShare) {
    throw new AppError('Note is already shared with this user', 409, 'ALREADY_SHARED');
  }
  
  await db('shared_notes').insert({
    note_id: noteId,
    user_id: userId,
    shared_with_id: sharedWithId
  });
  
  return {
    note_id: noteId,
    shared_with: sharedWithUser
  };
};

const searchNotes = async (userId, query, options = {}) => {
  const { page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;
  
  const searchQuery = db('notes')
    .whereRaw('MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE)', [query])
    .andWhere(function() {
      this.where('user_id', userId)
        .orWhereExists(function() {
          this.select('*')
            .from('shared_notes')
            .whereRaw('shared_notes.note_id = notes.id')
            .andWhere('shared_notes.shared_with_id', userId);
        });
    })
    .orderBy('updated_at', 'desc')
    .limit(limit)
    .offset(offset);
  
  const countQuery = db('notes')
    .whereRaw('MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE)', [query])
    .andWhere(function() {
      this.where('user_id', userId)
        .orWhereExists(function() {
          this.select('*')
            .from('shared_notes')
            .whereRaw('shared_notes.note_id = notes.id')
            .andWhere('shared_notes.shared_with_id', userId);
        });
    })
    .count('id as count')
    .first();
  
  const [results, total] = await Promise.all([searchQuery, countQuery]);
  
  const notes = await Promise.all(results.map(async (note) => {
    if (note.user_id === userId) {
      return note;
    }
    
    const sharedInfo = await db('shared_notes')
      .where('note_id', note.id)
      .andWhere('shared_with_id', userId)
      .first();
    
    return {
      ...note,
      is_shared: true,
      owner_id: sharedInfo.user_id
    };
  }));
  
  return {
    notes,
    pagination: {
      total: total.count,
      page,
      limit,
      pages: Math.ceil(total.count / limit)
    }
  };
};

module.exports = {
  createNote,
  getNotesByUser,
  getNoteById,
  updateNote,
  deleteNote,
  shareNote,
  searchNotes
};