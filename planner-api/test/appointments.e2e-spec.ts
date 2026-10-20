import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp } from './utils/create-test-app.js';
import { resetDatabase } from './utils/database.js';
import { api } from './utils/http.js';
import { createUser } from './utils/users.js';

const unknownUuid = '6f1c1f0e-9d6b-4c52-8f7e-2d5f3a1b9c10';

const validPatient = {
  name: 'Maria Silva',
  phone: '+5511987654321',
  email: 'maria@example.com',
  birthDate: '1990-05-20',
  gender: 'FEMALE',
  height: 165,
  weight: 62.5,
};

describe('Appointments (e2e)', () => {
  let app: INestApplication<App>;
  let valid: {
    patientUuid: string;
    doctorUuid: string;
    startTime: string;
    endTime: string;
    description: string;
  };

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    const { body: patient } = await api(app)
      .post('/patients')
      .send(validPatient)
      .expect(201);
    const doctor = await createUser(app, { role: 'DOCTOR' });
    valid = {
      patientUuid: patient.uuid,
      doctorUuid: doctor.uuid,
      startTime: '2026-10-20T13:00:00Z',
      endTime: '2026-10-20T14:00:00Z',
      description: 'Consulta de rotina',
    };
  });

  afterAll(async () => {
    await app.close();
  });

  const post = (body: object) => api(app).post('/appointments').send(body);

  describe('POST /appointments', () => {
    it('R3: creates an appointment and exposes uuids without internal ids', async () => {
      const { body } = await post(valid).expect(201);

      expect(body).toEqual({
        uuid: expect.stringMatching(/^[0-9a-f-]{36}$/),
        patientUuid: valid.patientUuid,
        doctorUuid: valid.doctorUuid,
        startTime: '2026-10-20T13:00:00.000Z',
        endTime: '2026-10-20T14:00:00.000Z',
        description: valid.description,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('R3: returns times in UTC regardless of the input offset', async () => {
      const { body } = await post({
        ...valid,
        startTime: '2026-10-20T10:00:00-03:00',
        endTime: '2026-10-20T10:30:00.5-03:00',
      }).expect(201);

      expect(body.startTime).toBe('2026-10-20T13:00:00.000Z');
      expect(body.endTime).toBe('2026-10-20T13:30:00.500Z');
    });

    it('R3: trims the description', async () => {
      const { body } = await post({
        ...valid,
        description: '  Retorno  ',
      }).expect(201);

      expect(body.description).toBe('Retorno');
    });

    it('R3: accepts a description with 1000 characters', () => {
      return post({ ...valid, description: 'a'.repeat(1000) }).expect(201);
    });

    it('R3: allows an appointment in the past', () => {
      return post({
        ...valid,
        startTime: '2020-01-10T09:00:00Z',
        endTime: '2020-01-10T10:00:00Z',
      }).expect(201);
    });

    it.each([
      'patientUuid',
      'doctorUuid',
      'startTime',
      'endTime',
      'description',
    ])('R3: rejects a missing %s with 400', async (field) => {
      const payload: Record<string, unknown> = { ...valid };
      delete payload[field];
      await post(payload).expect(400);
    });

    it.each([
      ['patientUuid', 'not-a-uuid'],
      ['doctorUuid', '123'],
      ['startTime', '2026-10-20T13:00:00'],
      ['startTime', '2026-10-20'],
      ['startTime', '2026-02-30T10:00:00Z'],
      ['startTime', '2026-10-20T25:00:00Z'],
      ['startTime', 1792501200000],
      ['endTime', '2026-10-20T14:00:00+0300'],
      ['description', null],
      ['description', ''],
      ['description', '   '],
    ])('R3: rejects invalid %s=%j with 400', async (field, value) => {
      await post({ ...valid, [field]: value }).expect(400);
    });

    it('R3: rejects a description over 1000 characters with 400', () => {
      return post({ ...valid, description: 'a'.repeat(1001) }).expect(400);
    });

    it('R3: rejects an extra field with 400', () => {
      return post({ ...valid, id: 1 }).expect(400);
    });

    it('I1: rejects startTime after endTime with 400', async () => {
      const { body } = await post({
        ...valid,
        startTime: valid.endTime,
        endTime: valid.startTime,
      }).expect(400);

      expect(body).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: ['startTime must be before endTime'],
      });
    });

    it('I1: rejects startTime equal to endTime, even with different offsets', () => {
      return post({
        ...valid,
        startTime: '2026-10-20T10:00:00-03:00',
        endTime: '2026-10-20T13:00:00Z',
      }).expect(400);
    });

    it('I2: returns 404 for an unknown patient', () => {
      return post({ ...valid, patientUuid: unknownUuid }).expect(404);
    });

    it('I2: returns 404 for a deleted patient', async () => {
      await app.get(PrismaService).patient.update({
        where: { uuid: valid.patientUuid },
        data: { deletedAt: new Date() },
      });

      return post(valid).expect(404);
    });

    it('I3: returns 404 for an unknown doctor', () => {
      return post({ ...valid, doctorUuid: unknownUuid }).expect(404);
    });

    it('I3: returns 404 for a deleted doctor', async () => {
      const doctor = await createUser(app, {
        role: 'DOCTOR',
        deletedAt: new Date(),
      });

      return post({ ...valid, doctorUuid: doctor.uuid }).expect(404);
    });

    it('I3: returns 404 for a user without role DOCTOR', async () => {
      const admin = await createUser(app, { role: 'ADMIN' });

      return post({ ...valid, doctorUuid: admin.uuid }).expect(404);
    });
  });
  describe('GET /appointments/:uuid', () => {
    it('R4: returns 200 with the same shape as POST', async () => {
      const { body: created } = await post(valid).expect(201);

      const { body } = await api(app)
        .get(`/appointments/${created.uuid}`)
        .expect(200);
      expect(body).toEqual(created);
    });

    it('R4: returns 404 for an unknown uuid', () => {
      return api(app).get(`/appointments/${unknownUuid}`).expect(404);
    });

    it('R4: returns 404 for a deleted appointment', async () => {
      const { body } = await post(valid).expect(201);
      await app.get(PrismaService).appointment.update({
        where: { uuid: body.uuid },
        data: { deletedAt: new Date() },
      });

      await api(app).get(`/appointments/${body.uuid}`).expect(404);
    });

    it.each(['not-a-uuid', '123', `${unknownUuid}x`])(
      'R4: returns 400 for an invalid uuid %j',
      (uuid) => {
        return api(app).get(`/appointments/${uuid}`).expect(400);
      },
    );
  });

  describe('GET /appointments', () => {
    const at = (hour: number) =>
      `2026-10-20T${String(hour).padStart(2, '0')}:00:00Z`;
    // Médicos distintos: horários iguais não colidem com a futura regra R9.
    const create = async (hour: number) => {
      const doctor = await createUser(app, { role: 'DOCTOR' });
      const { body } = await post({
        ...valid,
        doctorUuid: doctor.uuid,
        startTime: at(hour),
        endTime: at(hour + 1),
      }).expect(201);
      return body as { uuid: string };
    };
    const list = (query = '') => api(app).get(`/appointments${query}`);
    const uuids = (body: { data: { uuid: string }[] }) =>
      body.data.map((a) => a.uuid);

    it('R4: returns an empty page with defaults when there are no appointments', async () => {
      const { body } = await list().expect(200);
      expect(body).toEqual({
        data: [],
        meta: { page: 1, limit: 20, total: 0 },
      });
    });

    it('R4: lists appointments with the same shape as POST', async () => {
      const { body: created } = await post(valid).expect(201);

      const { body } = await list().expect(200);
      expect(body).toEqual({
        data: [created],
        meta: { page: 1, limit: 20, total: 1 },
      });
    });

    it('R4: orders by startTime, not by creation', async () => {
      const late = await create(15);
      const early = await create(9);
      const middle = await create(12);

      const { body } = await list().expect(200);
      expect(uuids(body)).toEqual([early.uuid, middle.uuid, late.uuid]);
    });

    it('R4: breaks startTime ties by creation order', async () => {
      const first = await create(10);
      const second = await create(10);
      const third = await create(10);

      const { body } = await list().expect(200);
      expect(uuids(body)).toEqual([first.uuid, second.uuid, third.uuid]);
    });

    it('R4: paginates without duplicates or gaps across pages', async () => {
      const created = [];
      for (const hour of [10, 8, 10, 8, 10]) {
        created.push(await create(hour));
      }
      const expected = [1, 3, 0, 2, 4].map((i) => created[i].uuid);

      const { body: page1 } = await list('?page=1&limit=2').expect(200);
      const { body: page2 } = await list('?page=2&limit=2').expect(200);
      const { body: page3 } = await list('?page=3&limit=2').expect(200);

      expect(page1.meta).toEqual({ page: 1, limit: 2, total: 5 });
      expect(page2.meta).toEqual({ page: 2, limit: 2, total: 5 });
      expect([...uuids(page1), ...uuids(page2), ...uuids(page3)]).toEqual(
        expected,
      );
    });

    it('R4: omits soft-deleted appointments from data and total', async () => {
      const deleted = await create(9);
      const kept = await create(10);
      await app.get(PrismaService).appointment.update({
        where: { uuid: deleted.uuid },
        data: { deletedAt: new Date() },
      });

      const { body } = await list().expect(200);
      expect(uuids(body)).toEqual([kept.uuid]);
      expect(body.meta.total).toBe(1);
    });

    it('R4: keeps appointments visible after the patient or doctor is deleted', async () => {
      const { body: created } = await post(valid).expect(201);
      const prisma = app.get(PrismaService);
      await prisma.patient.update({
        where: { uuid: valid.patientUuid },
        data: { deletedAt: new Date() },
      });
      await prisma.user.update({
        where: { uuid: valid.doctorUuid },
        data: { deletedAt: new Date() },
      });

      await api(app).get(`/appointments/${created.uuid}`).expect(200, created);
      const { body } = await list().expect(200);
      expect(body.data).toEqual([created]);
    });

    it('R4: accepts the maximum limit of 100', async () => {
      const { body } = await list('?limit=100').expect(200);
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
      'patientUuid=' + unknownUuid,
    ])('R4: rejects invalid query %s with 400', (query) => {
      return list(`?${query}`).expect(400);
    });
  });
});
