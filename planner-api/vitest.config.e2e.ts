import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    env: { APP_ENV: 'test' },
    // Aplica as migrations no banco de teste antes da suíte.
    globalSetup: ['./test/global-setup.ts'],
    // Os arquivos compartilham o banco de teste; em paralelo, um reset
    // apagaria dados de outro arquivo.
    fileParallelism: false,
  },
});
