# CLAUDE.md — Planner API

Backend de prontuário eletrônico (NestJS 12, TypeScript ESM, PostgreSQL 16, Prisma). Desenvolvimento assistido por IA com **DDD + TDD** e verificação explícita.

## Fontes da verdade (ler antes de codar)

1. [docs/prd.md](docs/prd.md) — o que entregar
2. [docs/domain.md](docs/domain.md) — agregados, regras (R1–R10) e invariantes (I1–I7)
3. [docs/architecture.md](docs/architecture.md) — stack, camadas, modelo ER, fluxo de engenharia
4. [docs/glossary.md](docs/glossary.md) — linguagem ubíqua (use os nomes em inglês no código: `Patient`, `User`, `Appointment`, `Observation`)

Se uma tarefa conflitar com esses documentos, **pare e pergunte** em vez de inventar regra. Decisões que mudam domínio ou stack exigem atualizar `docs/` no mesmo PR.

## Ambiente

- Node fixado em [.nvmrc](.nvmrc). **Sempre** rode `nvm use` na raiz antes de qualquer comando: o Node padrão do shell pode ser antigo e quebra lint/testes com erros de sintaxe.
- Toda aplicação vive em `planner-api/`; rode os comandos `yarn` a partir de lá.
- Gerenciador de pacotes: **yarn** (v1, `yarn.lock`). Não use npm/pnpm.
- Postgres: `docker compose up -d` na raiz sobe dev (`:5432`) e teste (`:5433`).
- Variáveis: `planner-api/.env.example` → `.env` (dev) e `.env.test.example` → `.env.test` (testes). Nunca commitar `.env`/`.env.test`.
- Banco configurado por variáveis separadas (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SCHEMA`); **não** use uma `DATABASE_URL` como fonte da verdade. A URL de conexão é montada em um único ponto de código, com `encodeURIComponent` em usuário e senha.

### Configuração por ambiente

Duas variáveis com papéis distintos (detalhes em [architecture.md](docs/architecture.md#configuração-por-ambiente)):

- `NODE_ENV` (`development` | `test` | `production`): modo do runtime/bibliotecas. **Staging usa `production`.** Definido pelo processo (Vitest, scripts, Dockerfile, plataforma), nunca em arquivo `.env`.
- `APP_ENV` (`development` | `test` | `staging` | `production`): onde a aplicação está implantada; seleciona o arquivo `.env.<APP_ENV>` e os defaults. Definido pelo processo (default `development`; `test` via config do Vitest), nunca em arquivo `.env`.

Regras:

- Nenhum código lê `process.env` fora do módulo de configuração; o resto injeta a config tipada.
- Variáveis validadas no boot (fail fast); `APP_ENV` fora do enum derruba a aplicação.
- Não ramifique comportamento com `if (APP_ENV === 'staging')`; use flags explícitas (`LOG_LEVEL`, `SWAGGER_ENABLED`, …) com defaults definidos por `APP_ENV` no módulo de configuração.
- Staging e produção não usam arquivos `.env`: variáveis vêm da plataforma/secret manager.
- Em teste, carregue **somente** `.env.test*`, sem fallback para `.env` — evita que testes atinjam o banco de dev.

## Comandos

```bash
nvm use
cd planner-api

yarn lint        # oxlint type-aware
yarn test        # unitários (*.spec.ts)
yarn test:e2e    # e2e (*.e2e-spec.ts, Vitest + Supertest)
yarn format      # prettier
yarn start:dev   # API em watch (porta 3000)
```

**Definition of Done:** `yarn lint`, `yarn test` e `yarn test:e2e` passando. Não declare uma tarefa concluída sem rodá-los e relatar o resultado real.

## Fluxo de trabalho (harness)

Cada entrega é uma **fatia vertical** (ordem em [domain.md](docs/domain.md#mapeamento-prd--fatias-verticais-ordem-sugerida)):

1. **Spec** — identificar as regras (R*/I*) cobertas pela fatia.
2. **Red** — escrever o teste que falha (e2e para fluxo REST; unitário para regra de domínio pura).
3. **Green** — implementação mínima, sem escopo extra.
4. **Refactor** — com testes verdes.
5. **Verify** — lint + unit + e2e.
6. **Docs** — atualizar `docs/` se a decisão afetar domínio/stack.

Branches: `feat/<descricao>-<issue>`, `fix/...`, `chore/...`, `docs/...`. Commits no padrão Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`). Nunca commitar direto na `main`.

Pull requests seguem obrigatoriamente [.github/pull_request_template.md](.github/pull_request_template.md):

- `## Motivo`: definição da tarefa + `[Tarefa no project](<url do item no GitHub Project>)`; inclua `Closes #<issue>` para vincular a issue.
- `## Como Testar`: passos reproduzíveis (comandos, requests, resultado esperado).
- Nenhum placeholder `#{...}` pode permanecer. O workflow [pr-template.yml](.github/workflows/pr-template.yml) reprova PRs fora do padrão.

## Convenções de código

- **ESM:** imports relativos com extensão `.js` (`import { X } from './x.js'`).
- **Módulos por capacidade** em `planner-api/src/`: `patients/`, `users/`, `appointments/`, `observations/`, `auth/`, `prisma/`.
- **Camadas:** controller (HTTP, status, delegação) → application service (caso de uso) → regras de domínio puras e testáveis → Prisma. Sem regra de negócio em controller.
- **Validação** de formato/presença em DTOs; regras entre agregados na camada de aplicação/domínio.
- **Identificadores:** a API expõe apenas `uuid`; `id` numérico é interno.
- **Soft delete** via `deletedAt`; listagens e validações de referência ignoram registros excluídos.
- `User` com `role = DOCTOR` representa o médico — não criar entidade `Doctor`.
- `Observation` referencia apenas `appointmentId` (nunca `patientId`/`userId` diretamente).
- Senhas só como `passwordHash`.
- Códigos HTTP: 201 criação, 400 validação, 404 referência inexistente, 409 conflito de agenda (R9).
- Testes ficam ao lado do código (`*.spec.ts`); e2e em `planner-api/test/` (`*.e2e-spec.ts`). Use o banco de teste (`:5433`), nunca o de dev.

## Estado atual

Fundação técnica pronta; nenhuma fatia de domínio implementada ainda (próxima: Patient, R1/R2).

- Config: `@nestjs/config` + zod em `planner-api/src/config/` (injete `ConfigService<Env, true>`).
- Prisma 7: schema em `planner-api/prisma/schema.prisma`; client gerado em `src/generated/prisma` (importe de `../generated/prisma/client.js`); `PrismaService` global. Após mudar o schema: `yarn prisma migrate dev --name <nome>` (dev) — os e2e aplicam migrations no banco de teste sozinhos.
- `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) e Swagger (`/docs`) em `src/app.setup.ts`, usado por `main.ts` e pelos e2e.
- E2E: use `createTestApp()` e `resetDatabase(app)` de `planner-api/test/utils/`.
- CI: `.github/workflows/ci.yml` roda lint + unit + e2e em todo PR.
