import { DatabaseEnv } from './env.js';

// Único ponto que monta a URL de conexão (aplicação e CLI do Prisma).
// Usuário e senha são URL-encoded aqui; os arquivos .env guardam o valor cru.
export function buildDatabaseUrl(database: DatabaseEnv): string {
  const user = encodeURIComponent(database.DB_USER);
  const password = encodeURIComponent(database.DB_PASSWORD);
  const name = encodeURIComponent(database.DB_NAME);
  const schema = encodeURIComponent(database.DB_SCHEMA);

  return `postgresql://${user}:${password}@${database.DB_HOST}:${database.DB_PORT}/${name}?schema=${schema}`;
}
