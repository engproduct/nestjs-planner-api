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
  });
});
