module.exports = {
  client: 'mysql2',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: '../src/db/migrations'
  },
  seeds: {
    directory: '../src/db/seeds'
  }
}; 