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
      ['name', '   '],
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

  describe('GET /patients', () => {
    const create = (i: number) =>
      api(app)
        .post('/patients')
        .send({ ...validPatient, email: `p${i}@example.com` })
        .expect(201);

    it('R2: lists only active patients, omitting soft-deleted', async () => {
      const { body: first } = await create(1);
      await create(2);
      await app.get(PrismaService).patient.update({
        where: { uuid: first.uuid },
        data: { deletedAt: new Date() },
      });

      const { body } = await api(app).get('/patients').expect(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].email).toBe('p2@example.com');
      expect(body.data[0]).not.toHaveProperty('id');
      expect(body.meta).toEqual({ page: 1, limit: 20, total: 1 });
    });

    it('returns an empty page with defaults when there are no patients', async () => {
      const { body } = await api(app).get('/patients').expect(200);
      expect(body).toEqual({
        data: [],
        meta: { page: 1, limit: 20, total: 0 },
      });
    });

    it('paginates with page and limit', async () => {
      for (const i of [1, 2, 3]) {
        await create(i);
      }

      const { body } = await api(app)
        .get('/patients?page=2&limit=2')
        .expect(200);
      expect(body.data.map((p: { email: string }) => p.email)).toEqual([
        'p3@example.com',
      ]);
      expect(body.meta).toEqual({ page: 2, limit: 2, total: 3 });
    });

    it('accepts the maximum limit of 100', async () => {
      const { body } = await api(app).get('/patients?limit=100').expect(200);
      expect(body.meta.limit).toBe(100);
    });

    it.each([
      'page=0',
      'page=-1',
      'page=abc',
      'page=1.5',
      'limit=0',
      'limit=-5',
      'limit=abc',
      'limit=101',
    ])('rejects invalid query %s with 400', (query) => {
      return api(app).get(`/patients?${query}`).expect(400);
    });
  });

  describe('PATCH /patients/:uuid', () => {
    const createOne = async (email = validPatient.email) => {
      const { body } = await api(app)
        .post('/patients')
        .send({ ...validPatient, email })
        .expect(201);
      return body as { uuid: string };
    };

    it('R2: updates partially and persists', async () => {
      const { uuid } = await createOne();

      const { body } = await api(app)
        .patch(`/patients/${uuid}`)
        .send({ name: 'Maria Souza', weight: 64 })
        .expect(200);
      expect(body).toMatchObject({ uuid, name: 'Maria Souza', weight: 64 });

      const { body: fetched } = await api(app)
        .get(`/patients/${uuid}`)
        .expect(200);
      expect(fetched).toMatchObject({
        name: 'Maria Souza',
        weight: 64,
        height: 165,
        email: 'maria@example.com',
      });
    });

    it('R2: normalizes an updated email', async () => {
      const { uuid } = await createOne();
      const { body } = await api(app)
        .patch(`/patients/${uuid}`)
        .send({ email: ' NEW@Example.com ' })
        .expect(200);
      expect(body.email).toBe('new@example.com');
    });

    it('R2: accepts re-sending the own email', async () => {
      const { uuid } = await createOne();
      await api(app)
        .patch(`/patients/${uuid}`)
        .send({ email: validPatient.email })
        .expect(200);
    });

    it.each([
      ['email', 'not-an-email'],
      ['height', 10],
      ['gender', 'UNKNOWN'],
      ['birthDate', '2999-01-01'],
      ['name', '   '],
    ])('R2: rejects invalid %s=%j with 400', async (field, value) => {
      const { uuid } = await createOne();
      await api(app)
        .patch(`/patients/${uuid}`)
        .send({ [field]: value })
        .expect(400);
    });

    it.each(Object.keys(validPatient))(
      'R2: rejects a null %s with 400',
      async (field) => {
        const { uuid } = await createOne();
        await api(app)
          .patch(`/patients/${uuid}`)
          .send({ [field]: null })
          .expect(400);
      },
    );

    it('R2: trims the name', async () => {
      const { uuid } = await createOne();
      const { body } = await api(app)
        .patch(`/patients/${uuid}`)
        .send({ name: '  Ana Souza  ' })
        .expect(200);
      expect(body.name).toBe('Ana Souza');
    });

    it('R2: rejects a future birthDate without changing the patient', async () => {
      const { uuid } = await createOne();
      await api(app)
        .patch(`/patients/${uuid}`)
        .send({ birthDate: '2999-01-01' })
        .expect(400);
      const { body } = await api(app).get(`/patients/${uuid}`).expect(200);
      expect(body.birthDate).toBe(validPatient.birthDate);
    });

    it.each([
      ['uuid', '6f1c1f0e-9d6b-4c52-8f7e-2d5f3a1b9c10'],
      ['id', 99],
    ])('R2: does not allow changing %s (400)', async (field, value) => {
      const { uuid } = await createOne();
      await api(app)
        .patch(`/patients/${uuid}`)
        .send({ [field]: value })
        .expect(400);
    });

    it('R2: returns 404 for an unknown uuid', () => {
      return api(app)
        .patch('/patients/6f1c1f0e-9d6b-4c52-8f7e-2d5f3a1b9c10')
        .send({ name: 'X' })
        .expect(404);
    });

    it('R2: returns 404 for a deleted patient', async () => {
      const { uuid } = await createOne();
      await app.get(PrismaService).patient.update({
        where: { uuid },
        data: { deletedAt: new Date() },
      });
      await api(app).patch(`/patients/${uuid}`).send({ name: 'X' }).expect(404);
    });

    it('R2: returns 400 for an invalid uuid', () => {
      return api(app).patch('/patients/not-a-uuid').send({}).expect(400);
    });

    it('R1: returns 409 when the email belongs to another active patient', async () => {
      await createOne('a@example.com');
      const { uuid } = await createOne('b@example.com');
      await api(app)
        .patch(`/patients/${uuid}`)
        .send({ email: 'A@example.com' })
        .expect(409);
    });
  });
});
