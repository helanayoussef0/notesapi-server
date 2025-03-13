require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { v4: uuidv4 } = require('uuid');

const { db, testConnection } = require('./config/database');
const { handleError } = require('./utils/errorHandler');
const logger = require('./utils/logger');
const { globalLimiter } = require('./api/middlewares/rateLimiter');

const authRoutes = require('./api/routes/auth');
const notesRoutes = require('./api/routes/notes');

const app = express();

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notes API',
      version: '1.0.0',
      description: 'Secure and scalable RESTful API for managing notes'
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/api/routes/*.js']
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.use(helmet()); 
app.use(cors()); 
app.use(compression()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

startServer();

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;