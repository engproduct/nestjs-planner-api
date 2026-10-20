import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Role, User } from '../../src/generated/prisma/client.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

interface CreateUserInput {
  role: Role;
  deletedAt?: Date | null;
  email?: string;
}

// Cria um User direto pelo Prisma: não há endpoint de usuários nesta fase.
// uuid e email únicos por padrão, para vários usuários no mesmo teste.
export async function createUser(
  app: INestApplication,
  { role, deletedAt = null, email }: CreateUserInput,
): Promise<User> {
  const uuid = randomUUID();
  return app.get(PrismaService).user.create({
    data: {
      uuid,
      email: email ?? `user-${uuid}@example.com`,
      role,
      deletedAt,
    },
  });
}
