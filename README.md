# prw2_2025_2_backend

API backend em Node + Express para gerenciar alunos, com autenticação por JWT.
Avaliação 3 — PRW2 (IFSP São Carlos).

## Tecnologias

- Node.js + Express
- jsonwebtoken (JWT)
- bcryptjs (hash de senhas)
- dotenv (variáveis de ambiente)
- nodemon (desenvolvimento)

## Como rodar

```bash
npm install
npm run dev
```

Servidor em `http://localhost:3000`. A raiz abre o frontend (`public/`).

## Variável de ambiente

Arquivo `.env`:

```env
JWT_SECRET = asdrubaltopolinsk
```

## Modelo de dados — Aluno

| Campo | Tipo    |
|-------|---------|
| id    | inteiro |
| nome  | string  |
| ra    | string  |
| nota1 | real    |
| nota2 | real    |

Os dados são armazenados em arrays em memória (3 alunos mockados ao iniciar).

## Endpoints

| Método | Rota                | JWT | Descrição |
|--------|---------------------|-----|-----------|
| POST   | `/register`         | Não | Cria usuário |
| POST   | `/login`            | Não | Retorna o token JWT |
| GET    | `/alunos`           | Sim | Todos os alunos |
| GET    | `/alunos/medias`    | Sim | nome e média |
| GET    | `/alunos/aprovados` | Sim | nome e status (aprovado/reprovado) |
| GET    | `/alunos/:id`       | Sim | Aluno específico |
| POST   | `/alunos`           | Sim | Cria aluno (id no corpo) |
| PUT    | `/alunos/:id`       | Sim | Altera aluno |
| DELETE | `/alunos/:id`       | Sim | Remove aluno |

Aprovação: `media = (nota1 + nota2) / 2`; `media >= 6` aprovado, senão reprovado.

## Autenticação

Após o login, envie o token nas rotas protegidas:

```
Authorization: Bearer <token>
```
