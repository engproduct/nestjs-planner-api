import { ConfigModule } from '@nestjs/config';
import { envFilePaths, resolveAppEnv, validateEnv } from './env.js';

// Único ponto da aplicação que lê process.env diretamente; o restante injeta
// ConfigService<Env, true>.
const appEnv = resolveAppEnv(process.env.APP_ENV);
const filePaths = envFilePaths(appEnv);

export const AppConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: filePaths,
  ignoreEnvFile: filePaths.length === 0,
  validate: validateEnv,
});
