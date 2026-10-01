import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { createTestApp } from './utils/create-test-app.js';
import { resetDatabase } from './utils/database.js';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health answers 200 after reaching the test database', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });
});
