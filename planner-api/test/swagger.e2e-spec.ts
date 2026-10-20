import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { createTestApp } from './utils/create-test-app.js';

describe('Swagger (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /docs-json serves the OpenAPI document', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);

    expect(response.body.openapi).toMatch(/^3\./);
    expect(response.body.paths).toHaveProperty('/health');
  });

  it('R4: documents the appointment response schemas', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);

    expect(
      Object.keys(body.components.schemas.AppointmentResponseDto.properties),
    ).toEqual([
      'uuid',
      'patientUuid',
      'doctorUuid',
      'startTime',
      'endTime',
      'description',
      'createdAt',
      'updatedAt',
    ]);
    const paths = body.paths;
    expect(paths['/appointments'].post.responses).toHaveProperty('201');
    expect(paths['/appointments'].get.responses).toHaveProperty('200');
    expect(paths['/appointments'].get.responses).toHaveProperty('400');
    expect(paths['/appointments/{uuid}'].get.responses).toHaveProperty('404');
  });
});
