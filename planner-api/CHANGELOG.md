# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota [SemVer](https://semver.org/lang/pt-BR/) `0.x`: cada PR da fatia entregue corresponde a uma versão minor.

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
