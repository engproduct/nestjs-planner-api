# Avaliação do projeto e maturidade do harness

> Snapshot de 2026-10-12 da ponta da pilha de PRs da fatia Patient: branch `feat/patient-update-23` (commit `448dfcd`, versão 0.9.0, PRs #32 a #35 ainda abertas). Links para arquivos de Patient só resolvem depois do merge das quatro PRs, em ordem.

## 1. Do que se trata

**Planner API** é o backend de um **prontuário eletrônico simplificado**, construído como resposta a um case de vaga backend ([PRD](./prd.md)). O médico:

- cadastra, lista e edita **pacientes** (nome, telefone, e-mail, nascimento, sexo, altura, peso);
- cria, lista, altera e exclui **agendamentos de consulta**;
- registra e consulta **observações clínicas** por consulta e o histórico do paciente;
- (desejável) tem a **agenda validada** contra sobreposição de horários e pode **anonimizar dados do paciente (LGPD)** mantendo o histórico.

O diferencial declarado do repositório não é o produto em si, mas **como ele é construído**: desenvolvimento assistido por IA com DDD + TDD e verificação explícita, o chamado *harness* ([README](../README.md#fluxo-de-trabalho-harness), [architecture.md › Programação agêntica](./architecture.md#programação-agêntica-harness)).

### Stack

| Camada | Escolha | Onde ver |
| --- | --- | --- |
| Runtime | Node 24.21.0 em [.nvmrc](../.nvmrc) e no [Dockerfile](../planner-api/Dockerfile); faixa `>=24.21.0 <25` em `engines` | [package.json](../planner-api/package.json) |
| Framework | NestJS 12, TypeScript ESM | [main.ts](../planner-api/src/main.ts), [app.module.ts](../planner-api/src/app.module.ts) |
| Banco | PostgreSQL 16 (dev `:5432`, teste `:5433`) | [docker-compose.yml](../docker-compose.yml) |
| ORM | Prisma 7.10 (`@prisma/adapter-pg`); client gerado em `src/generated/prisma` | [schema.prisma](../planner-api/prisma/schema.prisma), [prisma.config.ts](../planner-api/prisma.config.ts) |
| Configuração | `@nestjs/config` + zod, validada no boot, por `APP_ENV` | [src/config/](../planner-api/src/config) |
| API | `ValidationPipe` global, Swagger em `/docs`, healthcheck | [app.setup.ts](../planner-api/src/app.setup.ts) |
| Testes | Vitest 4 + Supertest; e2e com Postgres real | [vitest.config.ts](../planner-api/vitest.config.ts), [vitest.config.e2e.ts](../planner-api/vitest.config.e2e.ts) |
| Qualidade | oxlint (type-aware) + Prettier | [.oxlintrc.json](../planner-api/.oxlintrc.json) |
| CI/Release | GitHub Actions: lint + unit + e2e, gate de PR e CHANGELOG, tag de release | [.github/workflows/](../.github/workflows) |

### Modelo de domínio

Quatro agregados independentes, ligados por identidade ([domain.md › Agregados](./domain.md#agregados-e-entidades), [ER](./architecture.md#modelo-de-dados-er)):

```
Observation --appointmentId--> Appointment --patientId--> Patient
                                           --userId-----> User (role = DOCTOR)
```

- Não existe entidade `Doctor`: médico é `User` com `role = DOCTOR`.
- API expõe só `uuid` (gerado pela aplicação, sem default no banco); `id` numérico é interno; soft delete via `deletedAt`.
- Regras rastreáveis por ID: **R1–R10** e invariantes **I1–I7** ([domain.md › Regras de negócio](./domain.md#regras-de-negócio)).
- Ordem de entrega em fatias verticais: Patient → Appointment → Observation → User/Auth → Agenda (R9) → LGPD (R10) ([domain.md › Mapeamento](./domain.md#mapeamento-prd--fatias-verticais-ordem-sugerida)).

### Estado do código

| Fatia | Situação |
| --- | --- |
| Fundação técnica (config, Prisma, validação, Swagger, e2e com banco, CI) | Pronta e mergeada na `main` (0.1.0 a 0.5.0) |
| **Patient** (R1, R2) | Pronta em 4 PRs empilhadas, aguardando review (0.6.0 a 0.9.0): cadastro, email único entre ativos (409), consulta por `uuid`, listagem paginada e edição parcial |
| Appointment, Observation, User/Auth, Agenda, LGPD | Não iniciadas (Appointment é a próxima, #24) |

Verificação executada nesta avaliação (Node 24.21.0, ponta da pilha):

| Comando | Resultado |
| --- | --- |
| `yarn lint` | ✅ sem erros |
| `yarn test` | ✅ 6 arquivos, 39 testes |
| `yarn test:e2e` | ✅ 3 arquivos, 66 testes (banco de teste `:5433`) |
| CI das PRs #32 a #35 | ✅ três checks verdes em cada uma |

---

## 2. Maturidade do harness

### Escala usada

| Nível | Nome | Características |
| --- | --- | --- |
| 0 | Ad hoc | Prompts soltos; nenhum contexto persistente para o agente |
| 1 | Contexto | Instruções para o agente (CLAUDE.md / regras) e README |
| 2 | **Especificado** | Specs de domínio rastreáveis, DoD, fluxo de trabalho e convenções documentados; comandos de verificação definidos |
| 3 | Verificado automaticamente | CI roda lint/test/e2e; hooks do agente fazem lint/teste no loop; testes reais ligados às regras |
| 4 | Orquestrado | Skills/comandos por fatia, subagentes (revisor, testador), permissões configuradas, gates obrigatórios |
| 5 | Otimizado | Métricas (cobertura, taxa de retrabalho), avaliações do próprio harness, melhoria contínua |

### Veredito: **nível 2 consolidado, com o nível 3 cumprido pela metade**

Desde o snapshot anterior (2026-10-01, nível 2), duas das três condições do nível 3 passaram a existir:

| Condição do nível 3 | Situação |
| --- | --- |
| CI roda lint/test/e2e | ✅ [ci.yml](../.github/workflows/ci.yml) com Postgres como service e `node-version-file: .nvmrc` |
| Testes reais ligados às regras | ✅ e2e de Patient nomeados com o ID da regra (`R1: ...`, `R2: ...`) |
| Hooks do agente fazem lint/teste no loop | ❌ não há `.claude/` no repositório |

Ou seja, a camada de **verificação no CI** existe e funciona; a camada de **guarda-corpos do agente** (permissões, hooks, skills, subagentes) continua ausente. O harness ainda depende de o agente *ler e obedecer* às regras no momento de escrever; o CI pega o erro depois, na PR.

### Pontos fortes

| Elemento | Por que importa | Onde |
| --- | --- | --- |
| Fontes da verdade com ordem de leitura | O agente sabe o que ler antes de codar e deve **parar e perguntar** em caso de conflito | [CLAUDE.md › Fontes da verdade](../CLAUDE.md#fontes-da-verdade-ler-antes-de-codar), [docs/README.md](./README.md) |
| Regras com IDs (R1–R10, I1–I7) e teste sugerido | Cada fatia cita as regras que cobre; aceite é verificável | [domain.md › Regras](./domain.md#regras-de-negócio) |
| Linguagem ubíqua PT → EN | Evita nomes inventados (`Doctor`, `password`) | [glossary.md](./glossary.md#siglas-e-referências-cruzadas) |
| Definition of Done explícita | "Não declare concluído sem rodar lint + test + e2e e relatar o resultado real" | [CLAUDE.md › Comandos](../CLAUDE.md#comandos) |
| Fluxo Spec → Red → Green → Refactor → Verify → Docs → Release | Ciclo de TDD por fatia vertical, agora com diagrama no README; o histórico mostra commits de Red, Green, Docs e Release separados por PR | [README](../README.md#fluxo-de-trabalho-harness), [CLAUDE.md › Fluxo de trabalho](../CLAUDE.md#fluxo-de-trabalho-harness) |
| Gates de PR automatizados | Reprova PR sem `## Motivo`, link do Project, `## Como Testar`, entrada no CHANGELOG, bump de `version` ou link de diff | [pr-template.yml](../.github/workflows/pr-template.yml), [pull_request_template.md](../.github/pull_request_template.md) |
| Release rastreável | Tag `v<version>` criada no merge na `main`; PRs pequenas, uma por entrega, ligadas a issue e branch | [release-tag.yml](../.github/workflows/release-tag.yml), [CHANGELOG.md](../planner-api/CHANGELOG.md) |
| Ambiente determinístico | `nvm use` obrigatório, banco de teste separado, `.env.test` sem fallback para `.env` | [.nvmrc](../.nvmrc), [docker-compose.yml](../docker-compose.yml), [architecture.md › Configuração por ambiente](./architecture.md#configuração-por-ambiente) |
| Armadilhas documentadas | Node do shell quebra lint/testes; índice parcial de email não modelado pelo Prisma | [CLAUDE.md › Ambiente](../CLAUDE.md#ambiente), [CLAUDE.md › Estado atual](../CLAUDE.md#estado-atual) |
| Decisões de domínio registradas | Email único, `uuid` gerado pela aplicação e trim de `name` documentados no mesmo PR da mudança | [domain.md › Patient](./domain.md#agregado-patient-paciente) |

### Lacunas (o que separa do nível 3 completo e do 4)

Status em relação ao snapshot de 2026-10-01 (numeração preservada):

| # | Lacuna | Status | Situação atual / sugestão |
| --- | --- | --- | --- |
| 1 | Sem CI de qualidade | ✅ Resolvida | `ci.yml` roda lint, unit e e2e em todo PR. Falta confirmar na proteção de branch do GitHub se é check obrigatório (não verificável pelo repositório) |
| 2 | Sem `.claude/settings.json` (permissões, hooks) | ❌ Aberta | Hooks `PostToolUse` (format/lint no arquivo editado) e `Stop` (rodar testes); allowlist de `yarn`/`git` de leitura |
| 3 | Sem skills/comandos ou subagentes | ❌ Aberta | Skill `/slice <issue>` que guia Spec→Red→Green→Verify; subagente revisor que confere R*/I* e convenções |
| 4 | Testes são do scaffold | ✅ Resolvida para Patient | 39 unit + 66 e2e, estes com nomes por regra. Cada nova fatia deve repetir o padrão |
| 5 | Fundação ausente | ✅ Resolvida | Config, Prisma, `ValidationPipe`, Swagger e e2e com banco entregues |
| 6 | Regras só em texto | 🟡 Parcial | `main.ts` não lê mais `process.env`. Restam `prisma.config.ts` e `test/global-setup.ts` (legítimos: CLI e teste), em tensão com a frase do CLAUDE.md "nenhum código lê `process.env` fora do módulo de configuração". O [.oxlintrc.json](../planner-api/.oxlintrc.json) só tem 2 regras: falta `no-process-env` com exceções declaradas |
| 7 | Sem pre-commit | ❌ Aberta | `lefthook`/`husky` + `lint-staged`, ou hook do agente |
| 8 | Sem métricas | 🟡 Parcial | `test:cov` e `@vitest/coverage-v8` existem, mas sem threshold e fora do CI |
| 9 | Pequenas inconsistências nos docs | 🟡 Parcial | [domain.md](./domain.md#mapeamento-prd--fatias-verticais-ordem-sugerida) ainda cita "integration tests" sem config própria; [.env.test.example](../planner-api/.env.test.example) não tem `PORT`; política LGPD (R10) segue rascunho (agora com o placeholder de email anonimizado registrado) |
| 10 | Node não fixado de fato | 🟡 Parcial | O CI já usa `node-version-file: .nvmrc`; `engines` continua faixa `>=24.21.0 <25` e o [README](../README.md) ainda diz "fixado ... em `engines`" |
| 11 | Sem templates de issue / ADRs | ❌ Aberta | `.github/ISSUE_TEMPLATE/slice.md` com "Regras cobertas (R*/I*)" e "Aceite"; `docs/adr/`. Hoje as decisões vivem em `domain.md` e no CHANGELOG |
| 12 | **Nova:** testes escritos pela IA confirmam o caminho previsto | ❌ Aberta | O `PATCH` com `null` em qualquer campo respondia 500 e `name` só com espaços era aceito; ambos passaram no CI e só apareceram em review adversarial (corrigidos em `4e9c081`). Incluir no fluxo/skill de fatia um checklist de entradas inválidas (`null`, vazio, espaços, limites, tipo errado) e um passo de review que busque o que os testes **não** cobrem |

### Caminho sugerido

1. **Completar o nível 3:** hooks e permissões em `.claude/settings.json`, regra de lint para `process.env`, threshold de cobertura no CI.
2. **→ Nível 4:** skill de fatia vertical com o checklist de entradas inválidas (lacuna 12), subagente revisor de regras de domínio, issue template ligado a R*/I*.
3. **→ Nível 5:** cobertura com threshold, revisão periódica do CLAUDE.md com base nos erros recorrentes do agente (a lacuna 12 é um exemplo).
