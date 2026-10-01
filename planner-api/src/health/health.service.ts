import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface HealthStatus {
  status: 'ok';
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }
    return { status: 'ok' };
  }
}
