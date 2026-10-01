# NestJS Planner API

### About

Caso de desafio backend para a construção de um prontuário eletrônico em NestJS, com desenvolvimento assistido por IA (harness). Requisitos e engenharia (**DDD**, **TDD**, fluxo agêntico): **[documentação em `docs/`](./docs/README.md)** — comece pelo [PRD](./docs/prd.md).

---

### Setup

Node é fixado em [`.nvmrc`](./.nvmrc) (24.21.0) e em `engines` no `package.json`.

```
$ nvm use
$ docker compose up -d                 # Postgres dev (:5432) e teste (:5433)
$ cd planner-api
$ cp .env.example .env
$ cp .env.test.example .env.test
$ yarn install                        # também gera o Prisma Client
```

Swagger em http://localhost:3000/docs e healthcheck em http://localhost:3000/health.

---

### Run

```
$ cd planner-api
$ yarn start:dev
```

API em container (opcional): `docker compose --profile api up`. Detalhes em [docker-compose.yml](./docker-compose.yml) e [architecture.md](./docs/architecture.md).

---

### Validate

```
$ nvm use
$ cd planner-api
$ yarn lint
$ yarn test
$ yarn test:e2e
```
