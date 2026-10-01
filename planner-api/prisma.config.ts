import { config as loadEnvFiles } from 'dotenv';
import { defineConfig } from 'prisma/config';
import { buildDatabaseUrl } from './src/config/database-url.js';
import {
  Env,
  envFilePaths,
  resolveAppEnv,
  validateEnv,
} from './src/config/env.js';

// Configuração do CLI do Prisma. Usa as mesmas regras da aplicação:
// arquivos por APP_ENV, validação e montagem da URL em src/config.
const appEnv = resolveAppEnv(process.env.APP_ENV);
const filePaths = envFilePaths(appEnv);
if (filePaths.length > 0) {
  loadEnvFiles({ path: filePaths, quiet: true });
}

// `prisma generate` não precisa de banco (ex.: `yarn install` no CI ou no
// build da imagem); os demais comandos falham se a configuração for inválida.
const isGenerate = process.argv.includes('generate');
let env: Env | undefined;
try {
  env = validateEnv(process.env);
} catch (error) {
  if (!isGenerate) {
    throw error;
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: env ? { url: buildDatabaseUrl(env) } : undefined,
});
