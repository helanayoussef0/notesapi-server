require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const { db, testConnection } = require('./config/database');
const { handleError } = require('./utils/errorHandler');
const logger = require('./utils/logger');
const { globalLimiter } = require('./api/middlewares/rateLimiter');

const authRoutes = require('./api/routes/auth');
const notesRoutes = require('./api/routes/notes');

const app = express();

let swaggerDocument;
try {
  swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
  
  if (swaggerDocument.servers && swaggerDocument.servers.length > 0) {
    swaggerDocument.servers[0].url = process.env.API_URL || 'http://localhost:3001';
  }
} catch (error) {
  logger.error(`Failed to load Swagger document: ${error.message}`);
  swaggerDocument = {
    openapi: '3.0.0',
    info: {
      title: 'Notes API',
      version: '1.0.0',
      description: 'API documentation unavailable'
    }
  };
}

app.use(helmet()); 
app.use(cors()); 
app.use(compression()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  
  logger.info({
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  next();
});

app.use(globalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', async (req, res) => {
  try {
    await db.raw('SELECT 1+1 AS result');
    
    res.status(200).json({
      status: 'UP',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found'
    }
  });
});

app.use(handleError);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await testConnection();
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;