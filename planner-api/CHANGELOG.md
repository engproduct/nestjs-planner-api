# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota [SemVer](https://semver.org/lang/pt-BR/) `0.x`: cada PR da fatia entregue corresponde a uma versão minor.

## [0.5.0] - 2026-10-09

Fundação técnica 5/5 (#12, parte de #5).

### Adicionado

- CI (`.github/workflows/ci.yml`): lint, unit e e2e com Postgres como service, em todo PR e push na `main`.
- Regra de release: passo "Release" e DoD no `CLAUDE.md`, racional no `docs/architecture.md`, job em `pr-template.yml` que exige CHANGELOG e `version` alterados e workflow `release-tag.yml` que cria a tag `v<version>` no merge na `main`.
- Links de diff entre versões no rodapé do CHANGELOG (`compare/vA...vB`), exigidos pelo job de release do `pr-template.yml`.

### Alterado

- `CLAUDE.md` (Estado atual), `README.md` e `docs/architecture.md` refletem a fundação pronta.
- `version` do `package.json` e do Swagger para 0.5.0.

## [0.4.0] - 2026-10-09

Fundação técnica 4/5 (#11, parte de #5).

### Adicionado

- `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) e Swagger em `/docs` (controlado por `SWAGGER_ENABLED`) em `src/app.setup.ts`, compartilhado entre `main.ts` e os e2e.
- `GET /health` com `SELECT 1` no banco (503 se indisponível).
- Infraestrutura e2e com banco: `prisma migrate deploy` no global setup, `createTestApp()` e `resetDatabase(app)`, arquivos em série.

### Removido

- `AppController`/`AppService` "Hello World" e seus testes.

## [0.3.0] - 2026-10-09

Fundação técnica 3/5 (#10, parte de #5).

### Adicionado

- Prisma 7 (`@prisma/client` e `@prisma/adapter-pg`): `prisma.config.ts` reutilizando a URL do banco, `prisma/schema.prisma`, `PrismaModule` global e `PrismaService`.
- Script `postinstall` (`prisma generate`); client gerado em `src/generated/prisma`, ignorado no git, no lint e no Prettier.

### Alterado

- `Dockerfile` instala as dependências sem scripts e gera o Prisma Client depois de copiar o schema.
- `version` do `package.json` para 0.3.0.

## [0.2.0] - 2026-10-09

Fundação técnica 2/5 (#9, parte de #5).

### Adicionado

- Configuração tipada com `@nestjs/config` e zod (`src/config/`): `APP_ENV` seleciona `.env.<APP_ENV>`, validação no boot e montagem da URL do banco em um único ponto, com testes unitários.
- `APP_ENV=test` nos vitest configs; `.env.*` ignorado no git (exceto os `.example`).

### Alterado

- `main.ts` lê `PORT` via `ConfigService` (sem `process.env` fora do módulo de config).
- `version` do `package.json` para 0.2.0.

## [0.1.0] - 2026-10-09

Fundação técnica 1/5 (#8, parte de #5).

### Adicionado

- CLI `prisma` 7.10.0 como devDependency (lockfile gerado).
- `.gitattributes` marcando `planner-api/yarn.lock` como arquivo gerado, para o GitHub recolher o diff.
- Este CHANGELOG.

### Alterado

- `version` do `package.json` de 0.0.1 para 0.1.0.

## [0.0.0] - 2026-10-09

Baseline: scaffold NestJS e harness de desenvolvimento (documentação em `docs/`, template de PR e validação).

[0.5.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/engproduct/nestjs-planner-api/releases/tag/v0.0.0
