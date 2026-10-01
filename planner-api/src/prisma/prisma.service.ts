import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { buildDatabaseUrl } from '../config/database-url.js';
import { Env } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService<Env, true>) {
    const database = {
      DB_HOST: config.get('DB_HOST', { infer: true }),
      DB_PORT: config.get('DB_PORT', { infer: true }),
      DB_USER: config.get('DB_USER', { infer: true }),
      DB_PASSWORD: config.get('DB_PASSWORD', { infer: true }),
      DB_NAME: config.get('DB_NAME', { infer: true }),
      DB_SCHEMA: config.get('DB_SCHEMA', { infer: true }),
    };
    const adapter = new PrismaPg(
      { connectionString: buildDatabaseUrl(database) },
      { schema: database.DB_SCHEMA },
    );
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
