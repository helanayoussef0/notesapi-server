const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  await knex('users').del();
  
  const password = await bcrypt.hash('Password123', 10);
  
  return knex('users').insert([
    {
      username: 'admin',
      email: 'admin@example.com',
      password: password,
      full_name: 'Admin User',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      username: 'johndoe',
      email: 'john@example.com',
      password: password,
      full_name: 'John Doe',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      username: 'janedoe',
      email: 'jane@example.com',
      password: password,
      full_name: 'Jane Doe',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);
};