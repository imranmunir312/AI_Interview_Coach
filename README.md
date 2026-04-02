# AI Interview Coach

Full-stack chat interview assistant built with Turborepo:

- `apps/api`: NestJS + TypeORM + LangChain + Ollama
- `apps/web`: Next.js React frontend chat UI
- `packages/*`: shared tooling configs (eslint, tsconfig)

## Features

- role-based behaviour: interviewer / reviewer / mentor
- message history per session (Postgres-backed)
- in-memory LangChain history as `ChatMessageHistory`
- REST endpoints for history, query, clear

## Requirements

- Node.js 20+
- Yarn v1
- PostgreSQL
- Ollama server environment for `@langchain/ollama` model

## Environment

Create `.env` in `apps/api` (or root) with:

```
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=youruser
DB_PASSWORD=yourpass
DB_NAME=ai_interview_coach
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1
```

## Local setup

```bash
git clone <repo-url>
cd AI_Interview_Coach
yarn install
yarn workspace api install
yarn workspace web install
```

## Run

### Backend

```bash
cd apps/api
yarn start:dev
```

Expected API at `http://localhost:4000` (or 3001 if PORT adjusted)

### Frontend

```bash
cd apps/web
yarn dev
```

Open `http://localhost:3000`.

## API

- `POST /chat` body `{ sessionId, message, behaviour }`
- `GET /chat/:sessionId` history
- `DELETE /chat/:sessionId` clear history

### Behaviour values

- `interviewer`
- `reviewer`
- `mentor`

## Backend flow

- `apps/api/src/chat/chat.controller.ts` defines routes
- `ChatService.chat()` handles query, saves user and assistant messages
- `RunnableWithMessageHistory` loads DB history via `toChatMessageHistory`
- `ChatPromptTemplate` uses `MessagesPlaceholder('history')`

## Frontend flow

- `apps/web/app/chat/page.tsx` manages UI + localStorage session ID
- loads `GET /chat/:sessionId` on mount
- sends chat with `POST /chat`
- UI renders message bubbles and typing state

## Database

Entity: `apps/api/src/chat/user.entity.ts`

- `id`: primary
- `sessionId`: session key
- `role`: `USER` | `ASSISTANT` | ...
- `content`: text

## Commands

```bash
yarn workspace api typecheck
yarn workspace api lint
yarn workspace api test
yarn workspace api test:e2e
yarn workspace api test:cov
```

## Troubleshoot

- Confirm PostgreSQL is running and env vars are seeded
- Ensure Ollama is running and `OLLAMA_BASE_URL` is correct
- Adjust frontend API host if backend port differs
- Reset localStorage for cleaned session ID

## Deployment

- Build: `yarn turbo build`
- Deploy API on Node host with env vars
- Deploy web as Next.js site (Vercel recommended)
