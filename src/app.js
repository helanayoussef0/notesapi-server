require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { db, testConnection } = require('./config/database');
const { handleError } = require('./utils/errorHandler');
const logger = require('./utils/logger');
const { globalLimiter } = require('./api/middlewares/rateLimiter');

const authRoutes = require('./api/routes/auth');
const notesRoutes = require('./api/routes/notes');

const app = express();

let swaggerSpec;
try {
  swaggerSpec = YAML.load(path.join(__dirname, '../swagger.yaml'));
  
  if (swaggerSpec.servers && swaggerSpec.servers.length > 0) {
    swaggerSpec.servers[0].url = process.env.API_URL || 'http://localhost:3000';
  }
} catch (error) {
  logger.error(`Failed to load Swagger document: ${error.message}`);
  swaggerSpec = {
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

app.use('/api-docs', 
  swaggerUi.serve, 
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Notes API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  })
);

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

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Notes API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
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

const PORT = process.env.PORT || (process.env.NODE_ENV === 'test' ? 3002 : 3001);

const initializeApp = async () => {
  try {
    await testConnection();
    
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        logger.info(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
      });
    }
  } catch (error) {
    logger.error(`Failed to initialize app: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    process.exit(1);
  }
};

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  logger.error(`Stack trace: ${error.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled Rejection: ${error.message}`);
  logger.error(`Stack trace: ${error.stack}`);
  process.exit(1);
});

if (process.env.NODE_ENV !== 'test') {
  initializeApp().catch((error) => {
    logger.error(`Failed to start app: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    process.exit(1);
  });
}

module.exports = { app, PORT };