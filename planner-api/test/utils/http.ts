import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';

// Ponto único para chamadas HTTP dos e2e: a Auth anexará o token aqui.
export function api(app: INestApplication<App>) {
  return request(app.getHttpServer());
}
