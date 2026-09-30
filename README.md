# NestJS Planner API

### About

Caso de desafio backend para a construção de um prontuário eletrônico em NestJS, com desenvolvimento assistido por IA (harness). Requisitos e engenharia (**DDD**, **TDD**, fluxo agêntico): **[documentação em `docs/`](./docs/README.md)** — comece pelo [PRD](./docs/prd.md).

Relacionado: issue **Setup Harness Inicial** (#1).

---

### Run

```
$ cd planner-api
$ nvm use 24.21.0
$ yarn run start
```

Postgres (dev/test): ver [docker-compose.yml](./docker-compose.yml) e [architecture.md](./docs/architecture.md).

---

### Validate

```
$ cd planner-api
$ nvm use 24.21.0
$ yarn lint
$ yarn test
$ yarn test:e2e
```
