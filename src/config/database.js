const knex = require('knex');
const knexConfig = require('../../knexfile');
const logger = require('../utils/logger');

const environment = process.env.NODE_ENV || 'development';

const db = knex(knexConfig[environment]);

const testConnection = async () => {
  try {
    await db.raw('SELECT 1+1 AS result');
    logger.info(`Connected to ${environment} database successfully`);
    return true;
  } catch (error) {
    logger.error(`Failed to connect to ${environment} database: ${error.message}`);
    throw error;
  }
};

module.exports = {
  db,
  testConnection
};