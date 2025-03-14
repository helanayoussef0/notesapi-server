exports.seed = async function(knex) {
    await knex('notes').del();
    
    const users = await knex('users').select('id');
    
    const notes = [];
    
    if (users.length > 0) {
      const user1Id = users[0].id;
      const user2Id = users.length > 1 ? users[1].id : user1Id;
      
      notes.push(
        {
          user_id: user1Id,
          title: 'Welcome Note',
          content: 'Welcome to the Notes API! This is your first note.',
          is_archived: false,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          user_id: user1Id,
          title: 'Meeting Notes',
          content: 'Discussed project timeline and goals. Next meeting on Friday.',
          is_archived: false,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          user_id: user1Id,
          title: 'Ideas for Project',
          content: 'Feature ideas:\n- User notifications\n- Dark mode\n- Export to PDF',
          is_archived: false,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          user_id: user2Id,
          title: 'Shopping List',
          content: '- Milk\n- Eggs\n- Bread\n- Coffee',
          is_archived: false,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          user_id: user2Id,
          title: 'Book Recommendations',
          content: '1. The Pragmatic Programmer\n2. Clean Code\n3. Design Patterns',
          is_archived: false,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      );
    }
    
    return knex('notes').insert(notes);
  };