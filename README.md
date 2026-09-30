# NestJS Planner API

### About:

Caso de desafio backend para a construcao de um agendador de horarios em NestJS com desenvolvimento assistido por IA utilizando tecnicas harness, [maiores detalhes no PRD](./docs/prd.md)

---

### Run:

```
$ cd planner-api
$ yarn run start
```

---

 ### Diagrams:

```mermaid
erDiagram 
    patient {
        int id
        UUID uuid
        string name
        string phone
        string email
        date birthDate
        enum gender
        decimal height
        decimal weight
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    appointment {
        int id
        UUID uuid
        int patientId
        int doctorId
        string description
        string observation
        datetime startTime
        datetime endTime
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    doctor {
        int id
        UUID uuid
        string name
        string email
        string password
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    patient ||--o{ appointment : has
    doctor ||--o{ appointment : has
```