exports.up = function(knex) {
    return knex.schema.createTable('notes', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('title', 255).notNullable();
      table.text('content').notNullable();
      table.boolean('is_archived').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
  
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      
      table.index('user_id');
      table.index('title');
      table.index('is_archived');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('notes');
  };