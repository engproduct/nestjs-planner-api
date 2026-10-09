# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota [SemVer](https://semver.org/lang/pt-BR/) `0.x`: cada PR da fatia entregue corresponde a uma versão minor.

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

[0.2.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/engproduct/nestjs-planner-api/releases/tag/v0.0.0
