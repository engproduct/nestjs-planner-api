# Glossário — Planner API

Termos usados no [PRD](./prd.md), na documentação de domínio e na implementação. Em caso de conflito entre coloquial e código, prevalece o **nome em inglês** nas entidades da API e no banco (`Patient`, `Appointment`, etc.), com tradução indicada aqui.

---

## Domínio clínico e negócio

### Prontuário eletrônico

Registro digital das informações de saúde e dos atendimentos de um **paciente**. Neste projeto, o escopo inicial é cadastro de pacientes, **agendamentos** e **observações** de consulta — não inclui prescrições, exames ou integração com convênios, salvo extensão futura explícita.

### Médico (`Doctor`)

Profissional de saúde que utiliza o sistema. Persona principal do PRD (“eu, como médico…”). Responsável por cadastrar e editar pacientes, gerir a agenda e registrar observações clínicas no contexto de um **agendamento**. No modelo de dados, possui identificação própria (nome, e-mail) e credenciais quando **autenticação** estiver implementada.

### Paciente (`Patient`)

Pessoa atendida pelo médico. Dados previstos no PRD: nome, telefone, e-mail, data de nascimento, sexo, altura e peso. Pode ter vários **agendamentos** ao longo do tempo. Sujeito às regras de **LGPD** (ver entrada *Exclusão de dados pessoais (LGPD)*).

### Agendamento de consulta (`Appointment`)

Compromisso na agenda do médico para atender um **paciente** em um intervalo de tempo (`startTime` / `endTime`). Inclui descrição do motivo ou contexto e, após ou durante o atendimento, a **observação** registrada pelo médico. No [diagrama ER](./architecture.md#modelo-de-dados-er), liga **Patient** e **Doctor**. “Consulta” no linguajar do PRD refere-se ao encontro clínico representado por este agendamento (não a um tipo separado de entidade).

### Observação (de consulta)

Texto anotado pelo médico **durante** ou em relação à consulta, armazenado no contexto do **agendamento** (`observation`). Diferente da descrição inicial do agendamento: a observação é o registro clínico ou anotação do que ocorreu no atendimento. O PRD exige poder **visualizar** as anotações das consultas dos pacientes (histórico por paciente).

### Agenda

Conjunto de **agendamentos** de um médico ao longo do tempo. Requisito desejável: **validação de agenda** — não permitir dois agendamentos que se sobreponham no mesmo horário para o mesmo médico (evitar “dois pacientes na mesma hora”).

### Perfil do paciente

Conjunto de dados cadastrais e antropométricos do **paciente** editáveis pelo médico (listagem e edição no PRD). Não confundir com conta de login: neste case, o foco é o cadastro clínico-administrativo, não o portal do paciente.

---

## Privacidade e retenção

### LGPD

*Lei Geral de Proteção de Dados* (Lei nº 13.709/2018, Brasil). No contexto deste sistema, impacta sobretudo o tratamento de **dados pessoais** do paciente (nome, contato, e-mail, data de nascimento, etc.).

### Dados pessoais

Informações que identificam ou podem identificar uma pessoa natural. No escopo do PRD, aplicam-se principalmente aos campos do **paciente**. Devem ser validados na entrada e, quando aplicável, removidos ou anonimizados conforme política de **exclusão LGPD**.

### Exclusão de dados pessoais (LGPD)

Requisito desejável: permitir **apagar ou anonimizar** os dados pessoais do paciente (direito do titular / adequação legal), **mantendo** registros necessários de **agendamentos** e **observações** para fins de contabilidade ou histórico clínico mínimo — ver regra **R8** e política LGPD em [domain.md](./domain.md).

### Soft delete (`deletedAt`)

Exclusão lógica: registro marcado com data de exclusão, deixando de aparecer em operações normais, sem apagar fisicamente a linha. Útil para auditoria e para implementar LGPD de forma gradual; não substitui, sozinho, anonimização de PII.

---

## Modelo de dados (termos técnicos do domínio)

### Identificador interno (`id`)

Chave numérica surrogate gerada pelo banco, usada em relações (`patientId`, `doctorId`).

### Identificador público (`uuid`)

Identificador estável exposto na API (preferível a expor `id` sequencial). Convenção recomendada para URLs e integrações.

### Sexo (`gender`)

Atributo cadastral do paciente; modelado como enum no diagrama ER. Valores e nomenclatura devem respeitar política de produto (inclusão, opção “não informado”, etc.) definida na implementação.

---

## API e qualidade (NFRs do PRD)

### API REST

Interface HTTP com recursos nomeados, verbos padronizados (GET, POST, PATCH, DELETE) e payloads **JSON**. Este backend é a fonte da verdade consumida por clientes (futuro front React).

### Validação (de entrada)

Verificação de **existência** (campos obrigatórios, referências a paciente/médico válidos) e **formato** (e-mail, datas, intervalos de horário) em criação e atualização, antes de persistir — garante consistência da base.

### Documentação OpenAPI / Swagger

Especificação machine-readable dos endpoints, schemas de request/response e códigos HTTP. Atende ao requisito de documentação gerada da interface da API.

### Teste unitário

Teste isolado de uma unidade de código (ex.: serviço com dependências mockadas).

### Teste de integração / e2e

Teste que exercita a aplicação de ponta a ponta (HTTP + banco real ou de teste), validando comportamento como o PRD descreve. Neste repo, a suíte e2e usa Vitest + Supertest.

---

## Projeto e engenharia (contexto deste repositório)

### PRD

*Product Requirements Document* — enunciado de requisitos; versão canônica neste repo: [prd.md](./prd.md).

### DDD (Domain-Driven Design)

Modelagem centrada no domínio: agregados, regras de negócio e linguagem ubíqua. Neste repo, módulos Nest e regras seguem [domain.md](./domain.md) e [architecture.md](./architecture.md).

### TDD (Test-Driven Development)

Desenvolvimento guiado por testes (red → green → refactor). Comportamento do PRD vira testes e2e/unitários antes ou junto da implementação mínima.

### Harness (desenvolvimento assistido)

Conjunto de práticas e artefatos (PRD, glossário, domínio, arquitetura, testes, CI, regras para agente) que tornam o trabalho com IA **verificável**: spec clara + comando repetível (`lint`, `test`) + critérios de aceite.

### Vertical slice

Incremento fino que entrega um fluxo completo (ex.: criar paciente via API + persistência + teste e2e), em vez de “só camada de banco” ou “só controllers” sem valor de negócio demonstrável.

---

## Siglas e referências cruzadas

| Termo (PT)     | Entidade / código (EN) | Ver também        |
|----------------|------------------------|-------------------|
| Paciente       | `Patient`              | PRD cadastro    |
| Médico         | `Doctor`               | Autenticação JWT  |
| Agendamento    | `Appointment`          | Agenda, Observação |
| Consulta       | — (via `Appointment`)  | Observação        |
| Anotação       | `observation`          | Agendamento       |

---

*Última atualização: alinhado ao PRD e ao diagrama ER em [architecture.md](./architecture.md).*
