import { z } from 'zod';

export const APP_ENVS = [
  'development',
  'test',
  'staging',
  'production',
] as const;

export type AppEnv = (typeof APP_ENVS)[number];

const appEnvSchema = z.enum(APP_ENVS).default('development');

const booleanString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const envSchema = z.object({
  APP_ENV: appEnvSchema,
  PORT: z.coerce.number().int().positive().default(3000),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive(),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_SCHEMA: z.string().min(1),
  SWAGGER_ENABLED: booleanString.optional(),
});

// Comportamento por ambiente via flags explícitas: APP_ENV só define o
// default, e a variável correspondente sempre pode sobrescrevê-lo.
const defaultsByAppEnv: Record<AppEnv, { SWAGGER_ENABLED: boolean }> = {
  development: { SWAGGER_ENABLED: true },
  test: { SWAGGER_ENABLED: true },
  staging: { SWAGGER_ENABLED: true },
  production: { SWAGGER_ENABLED: false },
};

export type Env = Omit<z.output<typeof envSchema>, 'SWAGGER_ENABLED'> & {
  SWAGGER_ENABLED: boolean;
};

export type DatabaseEnv = Pick<
  Env,
  'DB_HOST' | 'DB_PORT' | 'DB_USER' | 'DB_PASSWORD' | 'DB_NAME' | 'DB_SCHEMA'
>;

export function resolveAppEnv(value: string | undefined): AppEnv {
  const result = appEnvSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `Invalid APP_ENV "${value}": expected one of ${APP_ENVS.join(', ')}`,
    );
  }
  return result.data;
}

// Arquivos carregados por APP_ENV; o primeiro da lista vence. Em teste não há
// fallback para .env, para que os testes nunca atinjam o banco de dev.
// Staging e produção recebem variáveis da plataforma, sem arquivo.
export function envFilePaths(appEnv: AppEnv): string[] {
  switch (appEnv) {
    case 'development':
      return ['.env.development.local', '.env.development', '.env'];
    case 'test':
      return ['.env.test.local', '.env.test'];
    case 'staging':
    case 'production':
      return [];
  }
}

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration:\n${z.prettifyError(result.error)}`,
    );
  }

  const env = result.data;
  return {
    ...env,
    SWAGGER_ENABLED:
      env.SWAGGER_ENABLED ?? defaultsByAppEnv[env.APP_ENV].SWAGGER_ENABLED,
  };
}
