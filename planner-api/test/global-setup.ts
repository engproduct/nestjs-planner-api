import { execSync } from 'node:child_process';

// Aplica as migrations pendentes no banco de teste antes da suíte e2e.
export default function setup(): void {
  execSync('yarn -s prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, APP_ENV: 'test' },
  });
}
