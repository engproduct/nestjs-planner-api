import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp } from './utils/create-test-app.js';
import { resetDatabase } from './utils/database.js';
import { createUser } from './utils/users.js';

describe('Users (persistência)', () => {
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

  it('createUser persiste médico e admin com uuid e email únicos', async () => {
    const doctor = await createUser(app, { role: 'DOCTOR' });
    const admin = await createUser(app, { role: 'ADMIN' });

    expect(doctor.uuid).not.toBe(admin.uuid);
    expect(doctor.email).not.toBe(admin.email);

    const rows = await app.get(PrismaService).user.findMany({
      orderBy: { id: 'asc' },
    });
    expect(rows.map((row) => row.role)).toEqual(['DOCTOR', 'ADMIN']);
    expect(rows.every((row) => row.passwordHash === null)).toBe(true);
  });

  it('createUser aceita deletedAt para simular médico excluído', async () => {
    const deletedAt = new Date();
    const user = await createUser(app, { role: 'DOCTOR', deletedAt });

    expect(user.deletedAt).toEqual(deletedAt);
  });
});
