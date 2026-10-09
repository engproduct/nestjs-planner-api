import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('reports ok when the database answers', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const service = new HealthService(prisma as unknown as PrismaService);

    await expect(service.check()).resolves.toEqual({ status: 'ok' });
  });

  it('throws 503 when the database is unreachable', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('connection refused')),
    };
    const service = new HealthService(prisma as unknown as PrismaService);

    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
