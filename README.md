# Notes API

A secure and scalable RESTful API that allows users to create, read, update, and delete notes with sharing capabilities and full-text search functionality.

## 🚀 Features

- User authentication with JWT
- CRUD operations for notes
- Note sharing between users
- Full-text search using MySQL's FULLTEXT indexing
- Rate limiting and request throttling
- Request logging with unique request IDs
- API documentation with Swagger/OpenAPI
- Health check endpoint
- Secure by default with various security middlewares

## 🤔 Technology Choices

### Framework: Express.js
- Lightweight and flexible Node.js framework
- Large ecosystem of middleware
- Excellent performance for REST APIs
- Strong community support and documentation
- Easy to scale and maintain

### Database: MySQL
- Strong ACID compliance for data integrity
- Framwork was already installed on local machine
- Excellent performance with proper indexing
- Built-in FULLTEXT search capabilities
- Robust security features
- Familiar SQL syntax for complex queries
- Knex.js as query builder for:
  - SQL injection prevention
  - Query building flexibility
  - Migration management
  - Connection pooling

### Third-Party Tools
- **Winston**: Chosen for flexible logging with multiple transports
- **Helmet**: Essential security headers with minimal configuration
- **Jest & Supertest**: Industry standard testing tools with great documentation
- **Swagger/OpenAPI**: Clear, interactive API documentation
- **Joi**: Robust request validation with detailed error messages
- **bcrypt**: Industry-standard password hashing
- **express-rate-limit**: Simple yet effective rate limiting

## 🛠 Tech Stack

- **Framework**: Express.js
- **Database**: MySQL with Knex.js as the query builder
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger/OpenAPI with YAML configuration
- **Testing**: Jest & Supertest
- **Security**: 
  - Helmet (HTTP headers)
  - Rate limiting
  - CORS
  - Request validation with Joi
  - Password hashing with bcrypt
- **Logging**: Winston

## 📋 Prerequisites

- Node.js (>= 18.0.0)
- MySQL (>= 8.0)
- npm or yarn

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd notesapi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file based on .env.sample:
   ```bash
   cp .env.sample .env
   ```

4. Configure your environment variables in .env:
   ```env
   # Application
   NODE_ENV=development
   PORT=3001
   API_URL=http://localhost:3001

   # Database - Development
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=notes_api_dev
   DB_DEBUG=false

   # Authentication
   JWT_SECRET=your-secret-key-should-be-at-least-32-chars
   JWT_EXPIRES_IN=24h

   # Logging
   LOG_LEVEL=info
   ```

5. Set up the database:

   a. Create MySQL database:
   ```sql
   CREATE DATABASE notes_api_dev;
   CREATE DATABASE notes_api_test;
   ```

   b. Run database migrations:
   ```bash
   npm run migrate
   ```

   c. (Optional) Seed the database:
   ```bash
   npm run seed
   ```

## 💻 Development Setup

1. Configure your IDE:
   - Enable ESLint integration
   - Enable EditorConfig support
   - Set up file watchers (optional)

2. Set up test environment:
   ```bash
   # Create test database
   mysql -u root -p -e "CREATE DATABASE notes_api_test"

   # Run migrations in test environment
   NODE_ENV=test npm run migrate
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 🧪 Testing

### Test Setup
1. Ensure test database exists and migrations are run:
   ```bash
   NODE_ENV=test npm run migrate
   ```

2. Configure test environment:
   - Create `.env.test` file
   - Set `NODE_ENV=test`
   - Use separate test database

### Running Tests
```bash
# Run all tests with coverage
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

```

### Test Structure
- `tests/unit/`: Unit tests for individual functions
- `tests/integration/`: API endpoint tests
- `tests/e2e/`: Full workflow tests

## 📚 API Documentation

Once the application is running, you can access the Swagger documentation at:
```
http://localhost:3001/api-docs
```

### Main Endpoints

#### Authentication
- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/login` - Log in to an existing account and receive an access token

#### Notes
- `GET /api/notes` - Get a list of all notes for the authenticated user
- `GET /api/notes/:id` - Get a specific note by ID
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:id` - Update an existing note
- `DELETE /api/notes/:id` - Delete a note
- `POST /api/notes/:id/share` - Share a note with another user
- `GET /api/search?q=:query` - Search notes based on keywords

## API Testing with Postman

This project includes a Postman collection for testing all API endpoints.

### Setup Instructions:

1. Import the collection file from `notes-api-postman-collection.json` into Postman
2. Create an environment with the following variables:
   - `baseUrl`: Your API URL (e.g., `http://localhost:3001`)
   - `token`: Will be filled automatically after registration/login
3. Execute the requests in the recommended order:
   - Register a new user
   - Login
   - Create/Read/Update/Delete notes

## 🔒 Security Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Password hashing with bcrypt
   - Protected routes with middleware

2. **API Security**
   - Rate limiting with express-rate-limit
   - CORS protection
   - Helmet security headers
   - Request validation
   - SQL injection protection through Knex.js
   - XSS protection

3. **Data Security**
   - Input sanitization
   - Request size limiting
   - Secure password storage
   - Environment variable protection

## 🎯 Performance Features

1. **Database**
   - FULLTEXT indexing for efficient search
   - Connection pooling with Knex.js
   - Prepared statements

2. **API**
   - Response compression
   - Efficient error handling
   - Request throttling

## 📈 Monitoring and Logging

- Detailed logging with Winston
- Request ID tracking
- Health check endpoint (`/health`)
- Error tracking and handling
- Database connection monitoring

## 📁 Project Structure

```
src/
├── api/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   │   ├── auth.js
│   │   └── notes.js
│   └── services/
├── config/
│   └── database.js
├── db/
├── utils/
│   ├── errorHandler.js
│   ├── logger.js
│   └── validator.js
└── app.js

tests/
├── unit/
├── integration/
└── e2e/
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- None currently reported. Please create an issue if you find one!

## 🔄 API Versioning

The API uses URL versioning (e.g., `/api/v1/`) to ensure backward compatibility as the API evolves.

## 🔍 Health Check

The API includes a health check endpoint at `/health` that monitors:
- Server status
- Database connectivity
- Current timestamp
 