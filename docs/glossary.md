# Glossário — Planner API

Termos usados no [PRD](./prd.md), na documentação de domínio e na implementação. Em caso de conflito entre coloquial e código, prevalece o **nome em inglês** nas entidades da API e no banco (`Patient`, `User`, `Appointment`, `Observation`, etc.), com tradução indicada aqui.

---

## Domínio clínico e negócio

### Prontuário eletrônico

Registro digital das informações de saúde e dos atendimentos de um **paciente**. Neste projeto, o escopo inicial é cadastro de pacientes, **agendamentos** e **observações** de consulta — não inclui prescrições, exames ou integração com convênios, salvo extensão futura explícita.

### Usuário (`User`)

Identidade do usuário do sistema, responsável por autenticação e autorização quando esses recursos estiverem implementados.

No contexto atual, usuários com `role = DOCTOR` representam os **médicos** que utilizam o sistema. O `User` concentra dados de identificação e credenciais de acesso, como nome, sobrenome, e-mail e senha armazenada como hash.

Não existe uma entidade ou agregado `Doctor` separado no modelo atual.

### Médico (`User` com `role = DOCTOR`)

Usuário do sistema que atua como médico no contexto do domínio. É a persona principal do PRD (“eu, como médico”).

Um médico pode cadastrar e editar pacientes, gerenciar sua agenda e registrar observações clínicas no contexto de um **agendamento**.

No modelo de dados, o médico é representado por um `User` cujo `role` é `DOCTOR`.

### Paciente (`Patient`)

Pessoa atendida pelo médico. Dados previstos no PRD: nome, telefone, e-mail, data de nascimento, sexo, altura e peso.

Pode ter vários **agendamentos** ao longo do tempo. Sujeito às regras de **LGPD** (ver entrada *Exclusão de dados pessoais (LGPD)*).

### Agendamento de consulta (`Appointment`)

Compromisso na agenda de um médico para atender um **paciente** em um intervalo de tempo (`startTime` / `endTime`).

Inclui descrição do motivo ou contexto da consulta. As observações clínicas são representadas por entidades `Observation` relacionadas ao `Appointment`.

No [diagrama ER](./architecture.md#modelo-de-dados-er), liga **Patient** e **User**. O `User` responsável pelo agendamento deve possuir `role = DOCTOR`.

“Consulta” no linguajar do PRD refere-se ao encontro clínico representado por este agendamento, não a um tipo separado de entidade.

### Observação (`Observation`)

Registro textual realizado pelo médico durante ou em relação a uma consulta.

Uma `Observation` pertence a um único `Appointment`, identificado por `appointmentId`. Um `Appointment` pode possuir zero ou várias `Observation`.

A observação é diferente da descrição inicial do agendamento: a descrição representa o contexto ou motivo do agendamento, enquanto a observação representa o registro clínico produzido durante ou após o atendimento.

A identidade da observação é própria (`uuid`) e seu ciclo de vida é independente do `Appointment`.

O PRD exige que o médico possa registrar observações e visualizar as anotações das consultas dos pacientes.

### Agenda

Conjunto de **agendamentos** de um médico ao longo do tempo.

Requisito desejável: **validação de agenda** — não permitir dois agendamentos que se sobreponham no mesmo horário para o mesmo médico, evitando “dois pacientes na mesma hora”.

### Perfil do paciente

Conjunto de dados cadastrais e antropométricos do **paciente** editáveis pelo médico (listagem e edição no PRD).

Não confundir com conta de login: neste case, o foco é o cadastro clínico-administrativo, não o portal do paciente.

---

## Privacidade e retenção

### LGPD

*Lei Geral de Proteção de Dados* (Lei nº 13.709/2018, Brasil).

No contexto deste sistema, impacta sobretudo o tratamento de **dados pessoais** do paciente (nome, contato, e-mail, data de nascimento, etc.).

### Dados pessoais

Informações que identificam ou podem identificar uma pessoa natural.

No escopo do PRD, aplicam-se principalmente aos campos do **paciente**. Devem ser validados na entrada e, quando aplicável, removidos ou anonimizados conforme política de **exclusão LGPD**.

### Exclusão de dados pessoais (LGPD)

Requisito desejável: permitir **apagar ou anonimizar** os dados pessoais do paciente, mantendo registros necessários de **agendamentos** e **observações** para fins de contabilidade ou histórico clínico mínimo — ver regra **R10** e política LGPD em [domain.md](./domain.md).

A estratégia exata de retenção e anonimização deve ser definida antes da implementação do caso de uso, considerando as obrigações legais e de produto.

### Soft delete (`deletedAt`)

Exclusão lógica: registro marcado com data de exclusão, deixando de aparecer em operações normais, sem apagar fisicamente a linha.

Útil para preservar referências e implementar políticas de retenção de forma controlada; não substitui, sozinho, a anonimização de PII.

---

## Modelo de dados (termos técnicos do domínio)

### Identificador interno (`id`)

Chave numérica surrogate gerada pelo banco, usada em relações internas (`patientId`, `userId`, `appointmentId`).

### Identificador público (`uuid`)

Identificador estável exposto na API, preferível a expor o `id` sequencial. Convenção recomendada para URLs e integrações.

### Usuário e papel (`User` / `role`)

`User` representa a identidade do sistema.

O campo `role` determina o papel de autorização do usuário. No contexto atual, o principal papel é:

```text
DOCTOR
```

Um `Appointment` possui um `userId` que referencia o usuário responsável. A camada de aplicação deve garantir que esse usuário possua o papel `DOCTOR`.

### Credencial (`passwordHash`)

Valor derivado da senha do usuário por algoritmo apropriado de hashing.

O sistema **não deve armazenar senhas em texto puro**. O campo persistido é `passwordHash`, não `password`.

### Sexo (`gender`)

Atributo cadastral do paciente; modelado como enum no diagrama ER.

Valores e nomenclatura devem respeitar a política de produto (inclusão, opção “não informado”, etc.) definida na implementação.

---

## API e qualidade (NFRs do PRD)

### API REST

Interface HTTP com recursos nomeados, verbos padronizados (GET, POST, PATCH, DELETE) e payloads **JSON**.

Este backend é a fonte da verdade consumida por clientes (futuro front React).

### Validação (de entrada)

Verificação de **existência** (campos obrigatórios e referências válidas) e **formato** (e-mail, datas, intervalos de horário etc.) em criação e atualização, antes de persistir — garantindo consistência da base.

Regras de negócio que envolvem múltiplos agregados devem ser verificadas na camada de aplicação/domínio conforme definido em [domain.md](./domain.md).

### Documentação OpenAPI / Swagger

Especificação machine-readable dos endpoints, schemas de request/response e códigos HTTP. Atende ao requisito de documentação gerada da interface da API.

### Teste unitário

Teste isolado de uma unidade de código, como uma regra de domínio ou serviço com dependências mockadas.

### Teste de integração / e2e

Teste que exercita a aplicação de ponta a ponta (HTTP + banco real ou de teste), validando comportamento como o PRD descreve.

Neste repo, a suíte e2e usa Vitest + Supertest.

---

## Projeto e engenharia (contexto deste repositório)

### PRD

*Product Requirements Document* — enunciado de requisitos; versão canônica neste repo: [prd.md](./prd.md).

### DDD (Domain-Driven Design)

Modelagem centrada no domínio: agregados, regras de negócio e linguagem ubíqua.

Neste repo, módulos Nest e regras seguem [domain.md](./domain.md) e [architecture.md](./architecture.md).

### TDD (Test-Driven Development)

Desenvolvimento guiado por testes (red → green → refactor).

Comportamento do PRD vira testes e2e/unitários antes ou junto da implementação mínima.

### Harness (desenvolvimento assistido)

Conjunto de práticas e artefatos (PRD, glossário, domínio, arquitetura, testes, CI, regras para agente) que tornam o trabalho com IA **verificável**: especificação clara + comando repetível (`lint`, `test`, `test:e2e`) + critérios de aceite.

### Vertical slice

Incremento fino que entrega um fluxo completo (ex.: criar paciente via API + persistência + teste e2e), em vez de implementar apenas uma camada isolada sem valor de negócio demonstrável.

---

## Siglas e referências cruzadas

| Termo (PT)  | Entidade / código (EN)     | Ver também                 |
| ----------- | -------------------------- | -------------------------- |
| Paciente    | `Patient`                  | PRD cadastro               |
| Usuário     | `User`                     | Autenticação / autorização |
| Médico      | `User` com `role = DOCTOR` | User, Autenticação JWT     |
| Agendamento | `Appointment`              | Agenda, Patient, User      |
| Consulta    | — (via `Appointment`)      | Observação                 |
| Observação  | `Observation`              | Appointment                |
| Anotação    | `Observation`              | Appointment                |
| Papel       | `role`                     | User, Autorização          |
| Credencial  | `passwordHash`             | User, Autenticação         |

---

*Última atualização: alinhado ao PRD e ao modelo ER em [architecture.md](./architecture.md).*
