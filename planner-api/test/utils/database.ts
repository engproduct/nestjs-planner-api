import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../src/config/env.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

// Esvazia todas as tabelas do schema (exceto o histórico de migrations).
// Recusa rodar fora de APP_ENV=test para nunca apagar o banco de dev.
export async function resetDatabase(app: INestApplication): Promise<void> {
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  if (config.get('APP_ENV', { infer: true }) !== 'test') {
    throw new Error('resetDatabase só pode rodar com APP_ENV=test');
  }

  const schema = config.get('DB_SCHEMA', { infer: true });
  const prisma = app.get(PrismaService);
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = ${schema} AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) {
    return;
  }

  const qualified = tables
    .map(({ tablename }) => `"${schema}"."${tablename}"`)
    .join(', ');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${qualified} RESTART IDENTITY CASCADE`,
  );
}
