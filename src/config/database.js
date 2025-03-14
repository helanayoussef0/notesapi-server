const path = require('path');
const fs = require('fs');
const knex = require('knex');
const logger = require('../utils/logger');

if (process.env.NODE_ENV === 'production') {
  const prodEnvPath = path.join(__dirname, '../../.env.production.local');
  if (fs.existsSync(prodEnvPath)) {
    require('dotenv').config({ path: prodEnvPath });
  }
} else {
  require('dotenv').config();
}

const knexConfig = require('../../knexfile');
const environment = process.env.NODE_ENV || 'development';

logger.info(`Using database environment: ${environment}`);
logger.info(`Database host: ${process.env.DB_HOST}`);
logger.info(`Database name: ${process.env.DB_NAME}`);

const db = knex(knexConfig[environment]);

const testConnection = async () => {
  try {
    logger.info('Testing database connection...');
    await db.raw('SELECT 1+1 AS result');
    logger.info(`Connected to ${environment} database successfully`);
    return true;
  } catch (error) {
    logger.error(`Failed to connect to ${environment} database: ${error.message}`);
    logger.error(`Error stack: ${error.stack}`);
    throw error;
  }
};

module.exports = {
  db,
  testConnection
};