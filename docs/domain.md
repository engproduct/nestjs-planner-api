# Domínio — Planner API

## Propósito

Modelo de domínio e regras de negócio derivadas do [PRD](./prd.md), para orientar implementação **DDD** e testes **TDD** no fluxo agêntico descrito em [architecture.md](./architecture.md). Vocabulário: [glossary.md](./glossary.md).

---

## Contexto delimitado

**Planner / prontuário simplificado:** suporte ao trabalho do **médico** com **pacientes**, **agenda de consultas** e **registro de observações** clínicas por atendimento. Não inclui billing, prescrição eletrônica, integração com laboratórios ou portal do paciente na v1.

**Ator principal:** médico, representado por um `User` com `role = DOCTOR`. Paciente não autentica no escopo inicial do case.

---

## Linguagem ubíqua (resumo)

| Termo              | Significado no domínio                                                                  |
| ------------------ | --------------------------------------------------------------------------------------- |
| Paciente           | Pessoa cadastrada com dados demográficos e antropométricos                              |
| Usuário            | Identidade do usuário do sistema                                                        |
| Médico             | Usuário com `role = DOCTOR`, profissional responsável pela agenda e autor das anotações |
| Agendamento        | Slot de consulta entre médico e paciente em intervalo de tempo                          |
| Observação         | Texto clínico/anotação vinculada a um agendamento                                       |
| Agenda             | Conjunto de agendamentos de um médico                                                   |
| Perfil do paciente | Dados cadastrais editáveis do paciente                                                  |
| Histórico clínico  | Conjunto de observações associadas aos agendamentos de um paciente                      |

---

## Agregados e entidades

Convenção: **raiz de agregado** possui identidade própria e expõe `uuid` na API. Referências entre agregados usam identidade (`uuid` ou id interno, conforme a camada), e não objetos ou agregados aninhados.

### Agregado `Patient` (Paciente)

**Raiz:** `Patient`

| Campo                             | Regra                                                             |
| --------------------------------- | ----------------------------------------------------------------- |
| name, phone, email                | Obrigatórios no cadastro (PRD); formatos validados na borda (DTO) |
| birthDate, gender, height, weight | Obrigatórios no cadastro (PRD)                                    |
| name                              | Normalizado (trim); vazio após o trim → 400                       |
| phone                             | Formato E.164                                                     |
| email                             | Normalizado (trim + minúsculas); único entre pacientes ativos; duplicata → 409 |
| birthDate                         | `YYYY-MM-DD`; não pode ser futura                                 |
| gender                            | `MALE`, `FEMALE`, `OTHER` ou `NOT_INFORMED`                       |
| height                            | Inteiro em cm, de 30 a 300                                        |
| weight                            | Decimal(5,2) em kg, de 0.5 a 700; exposto na API como `number`    |
| deletedAt                         | Soft delete; listagens padrão ignoram excluídos                   |

**Comportamentos (casos de uso):**

* Cadastrar paciente
* Listar pacientes ativos
* Editar perfil
* Consultar paciente por `uuid` (`GET /patients/:uuid`)

A listagem é paginada com `?page&limit` (default 20, máximo 100) e responde `{ data, meta: { page, limit, total } }`.

A edição (`PATCH /patients/:uuid`) é parcial: campos omitidos não mudam; `null` em qualquer campo → 400 (todos são obrigatórios).

**Consistência:**

Alterações de perfil não alteram agendamentos passados; a identidade do paciente (`uuid`) permanece estável.

---

### Agregado `User` (Usuário)

**Raiz:** `User`

`User` representa a identidade do usuário do sistema. No contexto atual, um médico é representado por um `User` cujo `role` é `DOCTOR`.

| Campo                | Regra                                                                                |
| -------------------- | ------------------------------------------------------------------------------------ |
| name, surname, email | Dados de identificação do usuário                                                    |
| passwordHash         | Credencial armazenada como hash; nunca armazenar senha em texto puro                 |
| role                 | Define o papel/autorização do usuário; no contexto atual, `DOCTOR` representa médico |
| deletedAt            | Soft delete                                                                          |

**Comportamentos:**

* Cadastro/gestão mínima de usuários
* Vinculação de agendamentos ao usuário responsável
* Autenticação/JWT fora do slice inicial, salvo issue específica de auth
* Autorização baseada em `role` quando autenticação estiver implementada

**Consistência:**

* Um `User` com `role = DOCTOR` pode atuar como médico no domínio.
* Não existe agregado `Doctor` separado.
* `Appointment` referencia o `User` responsável por meio de `userId`.
* A aplicação deve validar que o `User` associado ao agendamento possui `role = DOCTOR`.

---

### Agregado `Appointment` (Agendamento de consulta)

**Raiz:** `Appointment`

O `Appointment` representa o vínculo entre um paciente e um médico em determinado intervalo de tempo.

| Campo              | Regra                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| patientId          | Deve referenciar paciente existente e não excluído                    |
| userId             | Deve referenciar `User` existente, não excluído e com `role = DOCTOR` |
| startTime, endTime | Intervalo válido: `startTime < endTime`                               |
| description        | Contexto/motivo do agendamento                                        |
| deletedAt          | Soft delete; exclusão lógica do agendamento                           |

**Relacionamentos:**

* Um `Appointment` pertence a um `Patient`.
* Um `Appointment` pertence a um `User` com `role = DOCTOR`.
* Um `Appointment` pode possuir zero ou várias `Observation`.
* `Observation` não faz parte da identidade do `Appointment`.

**Comportamentos (casos de uso):**

* Cadastrar agendamento para paciente
* Listar, alterar e excluir agendamentos
* Consultar observações associadas ao agendamento
* Consultar histórico de observações de um paciente

**Referências:**

O agregado referencia `Patient` e `User` por identidade. A camada de aplicação valida a existência e o estado dos agregados referenciados antes de persistir o agendamento.

---

### Agregado `Observation` (Observação)

**Raiz:** `Observation`

Uma `Observation` representa uma anotação clínica registrada no contexto de um `Appointment`.

| Campo         | Regra                                                      |
| ------------- | ---------------------------------------------------------- |
| appointmentId | Deve referenciar um `Appointment` existente e não excluído |
| message       | Texto da observação clínica; obrigatório                   |
| createdAt     | Data/hora de criação da observação                         |
| updatedAt     | Data/hora da última alteração                              |
| deletedAt     | Soft delete da observação                                  |

**Relacionamento:**

* Uma `Observation` pertence a exatamente um `Appointment`.
* Um `Appointment` pode possuir zero ou várias `Observation`.
* `Observation` não referencia diretamente `Patient` ou `User`.
* O paciente e o médico da observação são determinados indiretamente pelo `Appointment`.

**Comportamentos (casos de uso):**

* Registrar observação para um agendamento
* Consultar observações de um agendamento
* Atualizar observação
* Excluir observação
* Consultar histórico de observações de um paciente

**Consistência:**

* Não é permitido criar uma `Observation` para um `Appointment` inexistente.
* Não é permitido criar uma `Observation` para um `Appointment` soft-deleted.
* A exclusão de uma `Observation` não exclui o `Appointment`.
* A alteração dos dados do `Patient` ou `User` não altera o conteúdo histórico da `Observation`.
* A `Observation` mantém sua própria identidade (`uuid`).

---

## Relação entre agregados

`Patient`, `User`, `Appointment` e `Observation` são agregados independentes.

As referências entre agregados ocorrem por identidade, evitando que um agregado precise carregar ou alterar outro agregado diretamente.

```mermaid
flowchart LR

  subgraph patientAgg [Agregado Patient]
    Patient[Patient RAIZ]
  end

  subgraph userAgg [Agregado User]
    User[User RAIZ]
  end

  subgraph appointmentAgg [Agregado Appointment]
    Appointment[Appointment RAIZ]
  end

  subgraph observationAgg [Agregado Observation]
    Observation[Observation RAIZ]
  end

  Appointment -->|patientId| Patient
  Appointment -->|userId| User
  Observation -->|appointmentId| Appointment
```

### Regra arquitetural

A referência entre agregados deve ser feita por identidade, e não por objeto:

```text
Observation
    |
    +-- appointmentId
             |
             v
       Appointment
          |      |
          |      +-- userId --> User
          |
          +-- patientId --> Patient
```

Isso permite que cada agregado tenha ciclo de vida e consistência próprios.

---

## Regras de negócio

### Obrigatórias (PRD)

| ID | Regra                                                     | Verificação sugerida (TDD)                  |
| -- | --------------------------------------------------------- | ------------------------------------------- |
| R1 | Paciente cadastrado com todos os campos exigidos          | e2e POST 400 se faltar campo; 201 se válido |
| R2 | Listar e editar perfil de pacientes cadastrados           | e2e GET/PATCH                               |
| R3 | Cadastrar agendamento vinculado a paciente e médico       | e2e POST appointment                        |
| R4 | Listar, alterar e excluir agendamentos                    | e2e GET/PATCH/DELETE                        |
| R5 | Registrar observação vinculada a um agendamento existente | e2e POST observation                        |
| R6 | Atualizar observação existente                            | e2e PATCH observation                       |
| R7 | Listar observações de um agendamento                      | e2e GET appointment/:id/observations        |
| R8 | Visualizar histórico de observações dos pacientes         | e2e GET por patientId/uuid                  |

### Desejáveis (PRD)

| ID  | Regra                                                                                                         | Notas de implementação                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R9  | **Agenda:** mesmo médico não pode ter dois agendamentos com sobreposição de horário                           | Domínio: função `intervalsOverlap(a,b)`; rejeitar com 409 Conflict                                                                                         |
| R10 | **LGPD:** excluir/anonimizar dados pessoais do paciente mantendo histórico de agendamentos para contabilidade | PII do `Patient` anonimizada ou removida; `Appointment` e `Observation` retêm somente o vínculo técnico necessário — detalhar política antes do slice LGPD |

### Invariantes (sempre verdadeiras)

* I1: `startTime < endTime` em todo agendamento persistido.
* I2: Não criar agendamento para paciente inexistente ou soft-deleted.
* I3: Não criar agendamento para `User` inexistente, soft-deleted ou sem `role = DOCTOR`.
* I4: Não criar observação para agendamento inexistente ou soft-deleted.
* I5: Toda `Observation` pertence a exatamente um `Appointment`.
* I6: `Observation` não possui vínculo direto com `Patient` ou `User`.
* I7: APIs REST expõem recursos coerentes com [architecture.md](./architecture.md) (JSON, códigos HTTP adequados).

---

## Política LGPD (rascunho para implementação)

Quando R10 for implementada:

1. **Solicitação de exclusão de dados pessoais** do paciente.

2. **Campos PII** (`name`, `phone`, `email`, `birthDate`, etc.) anonimizados ou substituídos por placeholders irreversíveis.

3. **Agendamentos** permanecem com horários e demais dados necessários para retenção histórica.

4. **Observações clínicas** permanecem sujeitas à política específica de retenção e anonimização definida para o prontuário.

5. Vínculos técnicos entre `Patient`, `Appointment` e `Observation` devem impedir reidentificação indevida após anonimização.

6. Operação **idempotente** e auditável (`updatedAt`).

Ajuste fino jurídico/produto deve ser registrado neste arquivo antes do agente implementar o caso de uso.

---

## Fora de escopo (v1)

* Multi-tenant / clínicas / equipes
* Paciente como usuário autenticado
* Notificações (SMS/e-mail) de lembrete
* Prontuário completo (CID, anexos, receitas)
* Relatórios financeiros além de retenção mínima citada no PRD
* Versionamento/auditoria completa das observações
* Anexos ou arquivos associados às observações

---

## Mapeamento PRD → fatias verticais (ordem sugerida)

1. **Patient** — R1, R2
2. **Appointment** — R3, R4
3. **Observation** — R5, R6, R7, R8
4. **User + Auth** — JWT e autorização (desejável PRD)
5. **Agenda** — R9
6. **LGPD** — R10

Cada fatia:

```text
teste que falha
      ↓
implementação mínima
      ↓
refatoração
      ↓
lint
      ↓
unit tests
      ↓
integration tests
      ↓
e2e tests
      ↓
commit
```

O fluxo agêntico deve respeitar as regras deste documento antes de criar ou modificar entidades, casos de uso, repositories ou endpoints.
