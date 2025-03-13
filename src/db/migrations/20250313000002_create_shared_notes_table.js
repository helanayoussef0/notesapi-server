exports.up = function(knex) {
    return knex.schema.createTable('shared_notes', function(table) {
      table.increments('id').primary();
      table.integer('note_id').unsigned().notNullable();
      table.integer('user_id').unsigned().notNullable();
      table.integer('shared_with_id').unsigned().notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.unique(['note_id', 'shared_with_id']);
      
      table.foreign('note_id').references('id').inTable('notes').onDelete('CASCADE');
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('shared_with_id').references('id').inTable('users').onDelete('CASCADE');
      
      table.index('note_id');
      table.index('user_id');
      table.index('shared_with_id');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('shared_notes');
  };