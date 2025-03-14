process.env.NODE_ENV = 'test';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';

jest.setTimeout(30000);

afterAll(async () => {
    const { db } = require('../src/config/database');
    await db.destroy();
  });