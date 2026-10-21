# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota [SemVer](https://semver.org/lang/pt-BR/) `0.x`: cada PR da fatia entregue corresponde a uma versão minor.

## [0.18.0] - 2026-10-21

Fatia Observation 1/4 (#50, parte de #49): registro de observação (R5).

### Adicionado

- `POST /appointments/:uuid/observations` → 201 com `uuid`, `appointmentUuid`, `message`, `createdAt` e `updatedAt`, sem ids internos. `message` obrigatória, com trim, de 1 a 5000 caracteres; ausente, vazia, só espaços, `null`, não string, longa demais ou campo extra (ex.: `patientUuid`, I6) → 400. Agendamento inexistente ou excluído → 404 (I4); paciente do agendamento excluído, ou médico excluído ou sem `role = DOCTOR` → **409** (histórico só leitura, como o `PATCH` de agendamento).
- A criação roda em `$transaction` com `SELECT … FOR UPDATE` na linha do agendamento, o lock que o `DELETE` de agendamento usará na fatia 3/4.
- Tabela `observations` (migration `observation`): única FK `appointmentId` (I5, I6), `message` em `Text`, `deletedAt` e índice `(appointmentId, createdAt)`. A migration não mexe no índice parcial `patient_email_active_unique`.
- Entidade `Observation` (`register`, `changeMessage`, `markDeleted`, `restore`; imutável) com testes unitários, `ObservationsModule`, `ObservationsService`, mapper e DTOs.
- e2e do R5 em `test/observations.e2e-spec.ts`.
- `docs/domain.md`: decisões da fatia Observation (rotas, `message`, 409 de histórico só leitura, lock, `DELETE`, leituras R7/R8).

### Alterado

- `version` do `package.json` e do Swagger para 0.18.0.

## [0.17.0] - 2026-10-20

Correções da revisão adversarial do #46 (#47): corrida `PATCH`×`DELETE` e edição de histórico de paciente/médico inativo.

### Alterado

- `PATCH /appointments/:uuid` em agendamento cujo paciente está excluído, ou cujo médico atual está excluído ou sem `role = DOCTOR`, → **409** para qualquer corpo (só `description`, o mesmo `doctorUuid`, troca para um médico válido e `{}`): o histórico (R10) fica só leitura. Ordem: agendamento inexistente/excluído → 404; referência atual inativa → 409; regras do agregado → 400; novo médico inválido → 404. O `DELETE` desse agendamento continua permitido. Documentado no Swagger e em `docs/domain.md`.
- `version` do `package.json` e do Swagger para 0.17.0.

### Corrigido

- `PATCH /appointments/:uuid` e `PATCH /patients/:uuid` não editam mais um registro excluído entre a leitura e a gravação: a gravação exige `deletedAt` nulo e o `P2025` do Prisma (helper `isNotFound`) vira 404.
- `doctorUuid` igual ao do médico atual em maiúsculas é tratado como o mesmo médico (sem revalidar I3).

## [0.16.0] - 2026-10-20

Fatia Appointment 4/4 (#28, conclui #24): edição e exclusão de agendamentos (R4).

### Adicionado

- `PATCH /appointments/:uuid` → 200 com o agendamento atualizado. Edita `startTime`, `endTime`, `description` e `doctorUuid`; o intervalo é validado com os valores combinados (atuais + novos, I1 → 400). `patientUuid` é imutável (no corpo → 400), `null` em qualquer campo → 400 e data sem offset → 400. Trocar o médico revalida I3 (inexistente, excluído ou `ADMIN` → 404). Agendamento inexistente ou excluído → 404; corpo vazio não altera nada e responde 200, como em `PATCH /patients/:uuid`.
- `DELETE /appointments/:uuid` → 204 (soft delete via `deletedAt`); inexistente ou já excluído → 404. O 409 com `Observation` ativa entra na fatia Observation.
- Entidade `Appointment`: `restore()`, `reschedule()` e `changeDescription()` (imutável, devolve nova instância), com testes unitários.
- `UpdateAppointmentDto` (`PartialType(PickType(...))`, `null` rejeitado).
- e2e de edição e exclusão do R4 em `test/appointments.e2e-spec.ts`.

### Alterado

- `version` do `package.json` e do Swagger para 0.16.0.
- `CLAUDE.md` › Estado atual: Appointment pronta; próxima fatia é Observation.

## [0.15.0] - 2026-10-20

Fatia Appointment 3/4 (#27, parte de #24): consulta e listagem de agendamentos (R4, leitura).

### Adicionado

- `GET /appointments/:uuid` → 200 com o mesmo formato do `POST`; inexistente ou excluído → 404; uuid malformado → 400.
- `GET /appointments` paginado (`{ data, meta: { page, limit, total } }`, como em Patient), sem agendamentos excluídos, ordenado por `startTime` e, em empate, por `id` (paginação estável). Agendamentos de paciente ou médico excluído depois continuam visíveis (R10).
- Decorators de Swagger do `AppointmentResponseDto` (adiados da #26) e respostas 200/paginada/400/404 documentadas.
- e2e de leitura do R4 em `test/appointments.e2e-spec.ts` e do schema de Appointment em `test/swagger.e2e-spec.ts`.
- `docs/domain.md`: limitação consciente de tempo (instante em UTC, sem fuso IANA da clínica).

### Alterado

- `version` do `package.json` e do Swagger para 0.15.0.

### Corrigido

- `PaginationQueryDto`: `page` fora do inteiro seguro (ex.: `page=1e20`) respondia 500; agora tem teto técnico (`MAX_SAFE_INTEGER / 100`) e responde 400. Vale também para `GET /patients`.

## [0.14.0] - 2026-10-20

Fatia Appointment 2/4 (#26, parte de #24): cadastro de agendamentos, `POST /appointments` (R3, I1–I3). Os decorators de Swagger do `AppointmentResponseDto` ficam para o 3/4 (#27), pelo corte de reserva do limite de 500 linhas.

### Adicionado

- `model Appointment` (`uuid` gerado pela aplicação, FKs `patientId`/`userId`, `startTime`/`endTime` em `Timestamptz(3)`, `description`, `deletedAt`, índice `(userId, startTime)`), com a migration `create_appointment`; a migration `appointment_time_range_check` (SQL manual) garante I1 também no banco com `CHECK ("startTime" < "endTime")`.
- Domínio em `src/appointments/domain/`: VO `TimeRange` (I1, `start < end`) e entidade `Appointment` (`schedule`, `description` com trim e de 1 a 1000 caracteres), com testes unitários.
- Validador `IsIsoDateTimeWithOffset` (`src/common/validation/`): ISO 8601 com offset obrigatório (`Z` ou `±hh:mm`), recusando data sem offset, só a data e datas de calendário impossíveis, com teste unitário.
- `POST /appointments` → 201: paciente inexistente ou excluído → 404 (I2); médico inexistente, excluído ou sem `role = DOCTOR` → 404 (I3). A resposta traz `patientUuid`/`doctorUuid` e as datas em UTC, sem ids internos.
- e2e de R3 em `test/appointments.e2e-spec.ts`.

### Alterado

- `version` do `package.json` e do Swagger para 0.14.0.

## [0.13.0] - 2026-10-20

Fatia Appointment 1/4 (#25, parte de #24): pré-requisito `User`/`Role` e seed. Nenhuma regra R* é entregue de ponta a ponta nesta versão.

### Adicionado

- `enum Role { DOCTOR, ADMIN }` e `model User` (`uuid` gerado pela aplicação, `email` único, `passwordHash` opcional até a Auth #30, `deletedAt`), com a migration `create_user`.
- `test/utils/users.ts` com `createUser(app, { role, deletedAt, email? })` e e2e de persistência.
- `prisma/seed.ts` (só dev, idempotente, executado por `yarn prisma db seed`): upsert de um `DOCTOR` com uuid fixo que imprime o `doctorUuid`; registrado em `prisma.config.ts`.
- `tsx` como devDependency, runner do seed.
- `docs/domain.md` e `docs/glossary.md`: ADMIN, `passwordHash` opcional e as decisões de Spec de Appointment (offset obrigatório, `Timestamptz`, UTC, PATCH, 409 com observações ativas).

### Alterado

- `version` do `package.json` e do Swagger para 0.13.0.

## [0.12.0] - 2026-10-20

Ajuste do deny de `--no-verify` entregue em #39 (#41). O teste numa sessão nova do Claude Code mostrou que `git -C <dir> commit --no-verify` passava, porque os padrões só casavam com o subcomando logo após `git`.

### Corrigido

- `.claude/settings.json` nega `--no-verify` e `git commit -n` também com opções globais entre `git` e o subcomando (`-C`, `-c`, `--git-dir`).
- O padrão `*core.hooksPath=*` vira `*core.hooksPath*` e passa a cobrir `git config core.hooksPath <valor>` e `GIT_CONFIG_KEY_0=core.hooksPath`. Efeito colateral: comandos de leitura que citem `core.hooksPath` (ex.: `git config --get core.hooksPath`) também são negados ao agente.

### Alterado

- `docs/architecture.md` e `docs/harness-assessment.md` descrevem a cobertura do `deny` e registram que ele evita acidentes; a garantia é o CI obrigatório na `main`.
- `version` do `package.json` e do Swagger para 0.12.0.

## [0.11.0] - 2026-10-20

Portões de verificação determinísticos (#39): hooks locais, deny de `--no-verify` ao Claude Code e proteção da `main`. Resolve as lacunas 1, 2 (parcial) e 7 de `docs/harness-assessment.md`.

### Adicionado

- Git hooks em `.githooks/`, ativados por `yarn install` (script `prepare` define `core.hooksPath`): `pre-commit` roda `yarn lint`; `pre-push` roda lint + unit + e2e, avisa se o Postgres de teste estiver fora do ar e não roda em `git push --delete`.
- `.claude/settings.json` com `deny` para `--no-verify` em `git commit`/`git push`, `git commit -n` e override de `core.hooksPath`; `.gitignore` na raiz com `.claude/settings.local.json`.
- Proteção da `main` no GitHub (PR obrigatório e os 3 checks de CI; admin pode contornar), aplicada fora do código.

### Alterado

- `CLAUDE.md`, `README.md`, `docs/architecture.md` e `docs/harness-assessment.md` descrevem as camadas de verificação.
- `version` do `package.json` e do Swagger para 0.11.0.

## [0.10.0] - 2026-10-12

Erro de domínio sem acoplamento a HTTP (#37, parte de #6). Ajuste da fatia Patient apontado em review: regra pura lançava `BadRequestException` e o 400 de data futura tinha formato diferente dos erros de validação.

### Adicionado

- `DomainError` e `DomainErrorFilter` global (`src/common/domain/`): regras puras lançam o erro de domínio e a borda HTTP o traduz para 400.
- `assertBirthDateNotInFuture` em `patient.rules.ts`, que concentra a regra antes duplicada em `create` e `update`.

### Alterado

- O 400 de data de nascimento futura passa a responder `message` em array (`{ statusCode, error, message: [...] }`), igual ao `ValidationPipe`.
- `docs/domain.md` e `CLAUDE.md` (Convenções) registram a convenção de erros de domínio.
- `version` do `package.json` e do Swagger para 0.10.0.

## [0.9.0] - 2026-10-09

Patient 4/4: edição (#23, parte de #6). Conclui a fatia Patient (R1, R2).

### Adicionado

- `PATCH /patients/:uuid` (R2): atualização parcial com `UpdatePatientDto` (`PartialType`), 404 para inexistente ou excluído, 400 para `uuid`/`id` no corpo ou data futura e 409 para email de outro paciente ativo.

### Alterado

- `CLAUDE.md` (Estado atual): Patient pronta (R1, R2); próxima: Appointment (#24).
- `Patient.uuid` passa a ser gerado pela aplicação (`randomUUID()` no service) em vez do `@default(uuid())` do Prisma Client; a coluna segue sem `DEFAULT` no banco e não há migration nova.
- `version` do `package.json` e do Swagger para 0.9.0.

### Corrigido

- `PATCH /patients/:uuid` com `null` em qualquer campo respondia 500; agora responde 400 (`PartialType` com `skipNullProperties: false`).
- `name` só com espaços era aceito no cadastro e na edição; agora passa por trim e, vazio, responde 400.

## [0.8.0] - 2026-10-09

Patient 3/4: listagem paginada (#22, parte de #6).

### Adicionado

- `GET /patients` paginado (`?page&limit`, default 20, máximo 100) que lista só pacientes ativos e responde `{ data, meta: { page, limit, total } }`.
- `src/common/pagination/`: `PaginationQueryDto`, `paginated()` e `ApiPaginatedResponse`, reutilizáveis no Appointment.

### Alterado

- `version` do `package.json` e do Swagger para 0.8.0.

## [0.7.0] - 2026-10-09

Patient 2/4: email único e consulta por uuid (#21, parte de #6).

### Adicionado

- Índice único parcial de `patients.email` entre ativos (SQL manual na migration `patient_email_active_unique`).
- `isUniqueViolation` (P2002) em `src/prisma/prisma-errors.ts`; email duplicado responde 409.
- `GET /patients/:uuid` (`ParseUUIDPipe`; 404 para inexistente ou excluído).

### Alterado

- `CLAUDE.md` e `docs/architecture.md`: 409 também vale para email duplicado; aviso sobre o índice parcial em migrations futuras.
- `version` do `package.json` e do Swagger para 0.7.0.

## [0.6.0] - 2026-10-09

Patient 1/4: cadastro (#20, parte de #6).

### Adicionado

- `enum Gender`, `model Patient` e migration `create_patient`.
- `POST /patients` (R1): DTO com validação, regras puras (`isBirthDateInFuture`, `normalizeEmail`), mapper sem `id`/`deletedAt` e Swagger.
- `test/utils/http.ts` (`api(app)`) e e2e de cadastro.

### Alterado

- `docs/domain.md` registra as decisões da fatia Patient; `docs/architecture.md` corrige `height` para `int`.
- `README.md` ganha a seção "Fluxo de trabalho (harness)" com o diagrama do fluxo Spec → Red → Green → Refactor → Verify → Docs → Release.
- `docs/domain.md`: política LGPD (rascunho) registra o placeholder `anon-<uuid>@anonymized.invalid` para o email anonimizado, com referência às RFCs 2606 e 6761.
- `docs/harness-assessment.md`: avaliação do projeto e da maturidade do harness atualizada para o estado de 2026-10-12 (fundação e Patient prontas, CI ativo, lacunas reclassificadas).
- `version` do `package.json` e do Swagger para 0.6.0.

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

[0.18.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/engproduct/nestjs-planner-api/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/engproduct/nestjs-planner-api/releases/tag/v0.0.0
