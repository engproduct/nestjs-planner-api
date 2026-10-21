import { randomUUID } from 'node:crypto';
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

describe('Observations (e2e)', () => {
  let app: INestApplication<App>;
  let patientUuid: string;
  let doctorUuid: string;
  let appointmentUuid: string;

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
    const { body: appointment } = await api(app)
      .post('/appointments')
      .send({
        patientUuid: patient.uuid,
        doctorUuid: doctor.uuid,
        startTime: '2026-10-20T13:00:00Z',
        endTime: '2026-10-20T14:00:00Z',
        description: 'Consulta de rotina',
      })
      .expect(201);
    patientUuid = patient.uuid;
    doctorUuid = doctor.uuid;
    appointmentUuid = appointment.uuid;
  });

  afterAll(async () => {
    await app.close();
  });

  const post = (body: object, uuid = appointmentUuid) =>
    api(app).post(`/appointments/${uuid}/observations`).send(body);

  describe('POST /appointments/:uuid/observations', () => {
    it('R5: creates an observation and exposes uuids without internal ids', async () => {
      const { body } = await post({
        message: 'Paciente relata melhora',
      }).expect(201);

      expect(body).toEqual({
        uuid: expect.stringMatching(/^[0-9a-f-]{36}$/),
        appointmentUuid,
        message: 'Paciente relata melhora',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('R5: trims the message', async () => {
      const { body } = await post({ message: '  texto \n' }).expect(201);

      expect(body.message).toBe('texto');
    });

    it('R5: rejects a NUL byte in the message with 400', async () => {
      const { body } = await post({ message: 'a\u0000b' }).expect(400);

      expect(Array.isArray(body.message)).toBe(true);
    });

    it('R5: accepts a message of exactly 5000 characters', async () => {
      await post({ message: 'a'.repeat(5000) }).expect(201);
    });

    it('I5/I6: stores only the appointment reference', async () => {
      const { body } = await post({ message: 'x' }).expect(201);

      const stored = await app
        .get(PrismaService)
        .observation.findUniqueOrThrow({ where: { uuid: body.uuid } });
      expect(Object.keys(stored).sort()).toEqual(
        [
          'appointmentId',
          'createdAt',
          'deletedAt',
          'id',
          'message',
          'updatedAt',
          'uuid',
        ].sort(),
      );
    });

    it.each([
      ['missing', {}],
      ['empty', { message: '' }],
      ['only spaces', { message: '   ' }],
      ['null', { message: null }],
      ['too long', { message: 'a'.repeat(5001) }],
      ['a number', { message: 123 }],
      ['an array', { message: ['x'] }],
      ['with an extra field', { message: 'x', extra: 1 }],
      ['with patientUuid (I6)', { message: 'x', patientUuid: unknownUuid }],
    ])('R5: rejects with 400 when the body is %s', async (_name, body) => {
      const { body: error } = await post(body).expect(400);

      expect(error.statusCode).toBe(400);
      expect(Array.isArray(error.message)).toBe(true);
    });

    it('R5: rejects a malformed appointment uuid with 400', async () => {
      await post({ message: 'x' }, 'not-a-uuid').expect(400);
    });

    it('I4: returns 404 for an unknown appointment', async () => {
      await post({ message: 'x' }, unknownUuid).expect(404);
    });

    it('I4: returns 404 for a deleted appointment', async () => {
      await api(app).delete(`/appointments/${appointmentUuid}`).expect(204);

      await post({ message: 'x' }).expect(404);
    });

    it('returns 409 when the appointment patient is deleted', async () => {
      await app.get(PrismaService).patient.update({
        where: { uuid: patientUuid },
        data: { deletedAt: new Date() },
      });

      await post({ message: 'x' }).expect(409);
    });

    it('returns 409 when the appointment doctor is deleted', async () => {
      await app.get(PrismaService).user.update({
        where: { uuid: doctorUuid },
        data: { deletedAt: new Date() },
      });

      await post({ message: 'x' }).expect(409);
    });

    it('returns 409 when the appointment doctor is not a DOCTOR anymore', async () => {
      await app.get(PrismaService).user.update({
        where: { uuid: doctorUuid },
        data: { role: 'ADMIN' },
      });

      await post({ message: 'x' }).expect(409);
    });
  });

  // Cria direto pelo Prisma para controlar createdAt e deletedAt.
  const seed = async (
    message: string,
    extra: {
      createdAt?: Date;
      deletedAt?: Date;
      appointmentUuid?: string;
    } = {},
  ) => {
    const prisma = app.get(PrismaService);
    const appointment = await prisma.appointment.findUniqueOrThrow({
      where: { uuid: extra.appointmentUuid ?? appointmentUuid },
    });
    return prisma.observation.create({
      data: {
        uuid: randomUUID(),
        appointmentId: appointment.id,
        message,
        createdAt: extra.createdAt,
        deletedAt: extra.deletedAt,
      },
    });
  };

  describe('GET /appointments/:uuid/observations', () => {
    const list = (query = '', uuid = appointmentUuid) =>
      api(app).get(`/appointments/${uuid}/observations${query}`);

    it('R7: lists only the appointment observations, ordered, without deleted ones', async () => {
      const { body: other } = await api(app)
        .post('/appointments')
        .send({
          patientUuid,
          doctorUuid,
          startTime: '2026-10-21T13:00:00Z',
          endTime: '2026-10-21T14:00:00Z',
          description: 'Retorno',
        })
        .expect(201);
      await seed('segunda', { createdAt: new Date('2026-10-20T15:00:00Z') });
      await seed('primeira', { createdAt: new Date('2026-10-20T14:00:00Z') });
      await seed('excluída', { deletedAt: new Date() });
      await seed('de outro', { appointmentUuid: other.uuid });

      const { body } = await list().expect(200);

      expect(body.data.map((o: { message: string }) => o.message)).toEqual([
        'primeira',
        'segunda',
      ]);
      expect(body.data[0]).toEqual({
        uuid: expect.stringMatching(/^[0-9a-f-]{36}$/),
        appointmentUuid,
        message: 'primeira',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(body.meta).toEqual({ page: 1, limit: 20, total: 2 });
    });

    it('R7: breaks createdAt ties by id and paginates stably', async () => {
      const createdAt = new Date('2026-10-20T14:00:00Z');
      for (const m of ['a', 'b', 'c']) await seed(m, { createdAt });

      const first = await list('?page=1&limit=2').expect(200);
      const second = await list('?page=2&limit=2').expect(200);

      expect(
        first.body.data.map((o: { message: string }) => o.message),
      ).toEqual(['a', 'b']);
      expect(
        second.body.data.map((o: { message: string }) => o.message),
      ).toEqual(['c']);
      expect(second.body.meta).toEqual({ page: 2, limit: 2, total: 3 });
    });

    it('R7: returns 200 with an empty list when there are no observations', async () => {
      const { body } = await list().expect(200);

      expect(body).toEqual({
        data: [],
        meta: { page: 1, limit: 20, total: 0 },
      });
    });

    it('returns 404 for an unknown appointment', async () => {
      await list('', unknownUuid).expect(404);
    });

    it('returns 404 for a deleted appointment', async () => {
      await app.get(PrismaService).appointment.update({
        where: { uuid: appointmentUuid },
        data: { deletedAt: new Date() },
      });

      await list().expect(404);
    });

    it('returns 400 for a malformed uuid', async () => {
      await list('', 'not-a-uuid').expect(400);
    });

    it.each(['page=0', 'page=abc', 'limit=0', 'limit=101', 'limit=1.5'])(
      'returns 400 for invalid pagination (%s)',
      async (query) => {
        await list(`?${query}`).expect(400);
      },
    );

    it('allows reading when the patient and the doctor are inactive', async () => {
      await seed('histórico');
      const prisma = app.get(PrismaService);
      await prisma.patient.update({
        where: { uuid: patientUuid },
        data: { deletedAt: new Date() },
      });
      await prisma.user.update({
        where: { uuid: doctorUuid },
        data: { deletedAt: new Date() },
      });

      const { body } = await list().expect(200);

      expect(body.meta.total).toBe(1);
    });
  });

  describe('GET /observations/:uuid', () => {
    it('returns the observation', async () => {
      const created = await seed('texto');

      const { body } = await api(app)
        .get(`/observations/${created.uuid}`)
        .expect(200);

      expect(body).toEqual({
        uuid: created.uuid,
        appointmentUuid,
        message: 'texto',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('returns 404 for an unknown observation', async () => {
      await api(app).get(`/observations/${unknownUuid}`).expect(404);
    });

    it('returns 404 for a deleted observation', async () => {
      const created = await seed('x', { deletedAt: new Date() });

      await api(app).get(`/observations/${created.uuid}`).expect(404);
    });

    it('returns 400 for a malformed uuid', async () => {
      await api(app).get('/observations/not-a-uuid').expect(400);
    });

    it('allows reading when the patient and the doctor are inactive', async () => {
      const created = await seed('histórico');
      const prisma = app.get(PrismaService);
      await prisma.patient.update({
        where: { uuid: patientUuid },
        data: { deletedAt: new Date() },
      });
      await prisma.user.update({
        where: { uuid: doctorUuid },
        data: { deletedAt: new Date() },
      });

      await api(app).get(`/observations/${created.uuid}`).expect(200);
    });
  });
});
