import { PrismaPg } from '@prisma/adapter-pg';
import { buildDatabaseUrl } from '../src/config/database-url.js';
import { validateEnv } from '../src/config/env.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

// Seed SOMENTE para desenvolvimento: como não existe GET /doctors, é a origem
// do doctorUuid usado ao agendar. Idempotente: o uuid e o email são fixos.
const DOCTOR_UUID = '3f1c5a0e-8b7d-4c52-9a41-6d2e7f9b0a11';
const DOCTOR_EMAIL = 'doctor@planner.local';

// O CLI do Prisma já carregou os arquivos .env (prisma.config.ts) neste processo.
const database = validateEnv(process.env);
const prisma = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString: buildDatabaseUrl(database) },
    { schema: database.DB_SCHEMA },
  ),
});

try {
  const doctor = await prisma.user.upsert({
    where: { email: DOCTOR_EMAIL },
    update: { deletedAt: null },
    create: { uuid: DOCTOR_UUID, email: DOCTOR_EMAIL, role: 'DOCTOR' },
  });
  console.log(`doctorUuid: ${doctor.uuid}`);
} finally {
  await prisma.$disconnect();
}
