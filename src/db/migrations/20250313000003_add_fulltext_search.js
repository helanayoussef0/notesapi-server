exports.up = function(knex) {
    return knex.schema.raw(`
      ALTER TABLE notes 
      ADD FULLTEXT INDEX note_search_idx (title, content)
    `);
  };
  
  exports.down = function(knex) {
    return knex.schema.raw(`
      ALTER TABLE notes 
      DROP INDEX note_search_idx
    `);
  };