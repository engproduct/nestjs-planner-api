import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { App } from 'supertest/types.js';
import { createTestApp } from './utils/create-test-app.js';
import { resetDatabase } from './utils/database.js';
import { api } from './utils/http.js';

const validPatient = {
  name: 'Maria Silva',
  phone: '+5511987654321',
  email: 'maria@example.com',
  birthDate: '1990-05-20',
  gender: 'FEMALE',
  height: 165,
  weight: 62.5,
};

describe('Patients (e2e)', () => {
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

  describe('POST /patients', () => {
    it('R1: creates a patient and exposes uuid without id/deletedAt', async () => {
      const { body } = await api(app)
        .post('/patients')
        .send(validPatient)
        .expect(201);

      expect(body).toMatchObject(validPatient);
      expect(body.uuid).toMatch(/^[0-9a-f-]{36}$/);
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();
      expect(body).not.toHaveProperty('id');
      expect(body).not.toHaveProperty('deletedAt');
    });

    it('R1: normalizes the email (trim + lowercase)', async () => {
      const { body } = await api(app)
        .post('/patients')
        .send({ ...validPatient, email: '  Maria@Example.COM ' })
        .expect(201);

      expect(body.email).toBe('maria@example.com');
    });

    it.each(Object.keys(validPatient))(
      'R1: rejects a missing %s with 400',
      (field) => {
        const payload: Record<string, unknown> = { ...validPatient };
        delete payload[field];
        return api(app).post('/patients').send(payload).expect(400);
      },
    );

    it.each([
      ['email', 'not-an-email'],
      ['phone', '11987654321'],
      ['birthDate', '20/05/1990'],
      ['birthDate', '1990-02-31'],
      ['birthDate', '2999-01-01'],
      ['gender', 'UNKNOWN'],
      ['height', 29],
      ['height', 301],
      ['height', 170.5],
      ['weight', 0.4],
      ['weight', 700.5],
      ['weight', 62.555],
    ])('R1: rejects invalid %s=%j with 400', (field, value) => {
      return api(app)
        .post('/patients')
        .send({ ...validPatient, [field]: value })
        .expect(400);
    });

    it('R1: rejects an extra field with 400', () => {
      return api(app)
        .post('/patients')
        .send({ ...validPatient, id: 1 })
        .expect(400);
    });
  });

  describe('R1: email unique among active patients', () => {
    it('rejects a duplicate email (normalized) with 409', async () => {
      await api(app).post('/patients').send(validPatient).expect(201);
      await api(app)
        .post('/patients')
        .send({ ...validPatient, email: '  MARIA@Example.com ' })
        .expect(409);
    });

    it('allows reusing the email of a deleted patient', async () => {
      const { body } = await api(app)
        .post('/patients')
        .send(validPatient)
        .expect(201);
      await app.get(PrismaService).patient.update({
        where: { uuid: body.uuid },
        data: { deletedAt: new Date() },
      });

      await api(app).post('/patients').send(validPatient).expect(201);
    });
  });

  describe('GET /patients/:uuid', () => {
    it('R2: returns 200 for an existing patient', async () => {
      const { body: created } = await api(app)
        .post('/patients')
        .send(validPatient)
        .expect(201);

      const { body } = await api(app)
        .get(`/patients/${created.uuid}`)
        .expect(200);
      expect(body).toEqual(created);
    });

    it('R2: returns 404 for an unknown uuid', () => {
      return api(app)
        .get('/patients/6f1c1f0e-9d6b-4c52-8f7e-2d5f3a1b9c10')
        .expect(404);
    });

    it('R2: returns 404 for a deleted patient', async () => {
      const { body } = await api(app)
        .post('/patients')
        .send(validPatient)
        .expect(201);
      await app.get(PrismaService).patient.update({
        where: { uuid: body.uuid },
        data: { deletedAt: new Date() },
      });

      await api(app).get(`/patients/${body.uuid}`).expect(404);
    });

    it('R2: returns 400 for an invalid uuid', () => {
      return api(app).get('/patients/not-a-uuid').expect(400);
    });
  });
});
