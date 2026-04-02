# QazaqUndestikBot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Telegram bot that teaches 5th grade students Kazakh vowel harmony (үндестік заңы) with theory, videos, exercises, tests, and AI Q&A, with teacher content management via Strapi CMS.

**Architecture:** Grammy bot (long-polling) communicates with Strapi v5 REST API for content and writes student progress to PostgreSQL via Prisma. All three services run in Docker Compose on a single Digital Ocean droplet.

**Tech Stack:** Node.js 24, TypeScript 5, Grammy v1, @grammyjs/conversations, Strapi v5, Prisma 5, PostgreSQL 16, @anthropic-ai/sdk (claude-haiku-20240307), Docker Compose, Jest + ts-jest + nock

---

## File Map

```
qazaq-undestik-bot/
├── docker-compose.yml
├── .env.example
├── strapi/
│   ├── Dockerfile
│   ├── package.json
│   ├── config/
│   │   └── database.ts          # postgres connection from env
│   └── src/api/
│       ├── theory/              # content type: Theory
│       ├── video/               # content type: Video
│       ├── test-question/       # content type: TestQuestion
│       └── exercise/            # content type: Exercise
└── bot/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── jest.config.js
    ├── prisma/
    │   └── schema.prisma
    └── src/
        ├── index.ts             # Grammy bot setup + handler wiring
        ├── config.ts            # env vars with validation
        ├── db/
        │   └── prisma.ts        # Prisma client singleton
        ├── keyboards/
        │   └── menus.ts         # main menu Keyboard
        ├── services/
        │   ├── strapi.ts        # HTTP client → Strapi REST API
        │   ├── progress.ts      # Prisma read/write for progress
        │   └── ai.ts            # Claude Haiku client
        └── handlers/
            ├── start.ts         # /start + main menu
            ├── theory.ts        # Grammy conversation: theory
            ├── video.ts         # Grammy conversation: video
            ├── exercises.ts     # Grammy conversation: exercises
            ├── tests.ts         # Grammy conversation: tests
            └── aiChat.ts        # Grammy conversation: AI Q&A
```

---

## Task 1: Docker Compose + environment scaffold

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: Create `.env.example`**

```
# PostgreSQL
POSTGRES_USER=qazaq
POSTGRES_PASSWORD=changeme

# Strapi secrets (generate with: node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")
STRAPI_APP_KEYS=key1,key2,key3,key4
STRAPI_API_TOKEN_SALT=changeme
STRAPI_ADMIN_JWT_SECRET=changeme
STRAPI_JWT_SECRET=changeme
STRAPI_TRANSFER_TOKEN_SALT=changeme

# Bot
BOT_TOKEN=your_telegram_bot_token
ANTHROPIC_API_KEY=your_anthropic_api_key

# Set after creating Strapi API token in admin panel
STRAPI_API_TOKEN=
```

- [ ] **Step 2: Create `docker-compose.yml`**

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: qazaq
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 10

  strapi:
    build: ./strapi
    environment:
      DATABASE_CLIENT: postgres
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: qazaq
      DATABASE_USERNAME: ${POSTGRES_USER}
      DATABASE_PASSWORD: ${POSTGRES_PASSWORD}
      APP_KEYS: ${STRAPI_APP_KEYS}
      API_TOKEN_SALT: ${STRAPI_API_TOKEN_SALT}
      ADMIN_JWT_SECRET: ${STRAPI_ADMIN_JWT_SECRET}
      JWT_SECRET: ${STRAPI_JWT_SECRET}
      TRANSFER_TOKEN_SALT: ${STRAPI_TRANSFER_TOKEN_SALT}
      NODE_ENV: production
    ports:
      - "1337:1337"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - strapi_uploads:/opt/app/public/uploads

  bot:
    build: ./bot
    environment:
      BOT_TOKEN: ${BOT_TOKEN}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/qazaq
      STRAPI_URL: http://strapi:1337
      STRAPI_API_TOKEN: ${STRAPI_API_TOKEN}
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
  strapi_uploads:
```

- [ ] **Step 3: Copy `.env.example` to `.env` and fill in real values**

```bash
cp .env.example .env
# Edit .env — fill BOT_TOKEN and ANTHROPIC_API_KEY at minimum
# Generate Strapi secrets:
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
# Run 4 times, use values for the 4 Strapi secret fields
# STRAPI_APP_KEYS needs 4 comma-separated values
```

- [ ] **Step 4: Commit**

```bash
git init
git add docker-compose.yml .env.example
git commit -m "chore: docker-compose and env scaffold"
```

---

## Task 2: Strapi v5 project + content type schemas

**Files:**
- Create: `strapi/Dockerfile`
- Create: `strapi/package.json`
- Create: `strapi/tsconfig.json`
- Create: `strapi/config/database.ts`
- Create: `strapi/src/api/theory/content-types/theory/schema.json`
- Create: `strapi/src/api/theory/controllers/theory.ts`
- Create: `strapi/src/api/theory/services/theory.ts`
- Create: `strapi/src/api/theory/routes/theory.ts`
- Create: `strapi/src/api/video/content-types/video/schema.json` (+ controllers/services/routes)
- Create: `strapi/src/api/test-question/content-types/test-question/schema.json` (+ controllers/services/routes)
- Create: `strapi/src/api/exercise/content-types/exercise/schema.json` (+ controllers/services/routes)

- [ ] **Step 1: Bootstrap Strapi project in `strapi/` directory**

```bash
# Run from qazaq-undestik-bot/ root
# Ensure Node 24 is active first. If your shell still resolves a different
# Homebrew Node version, run:
# export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
npx create-strapi-app@latest strapi \
  --no-run \
  --dbclient=postgres \
  --dbhost=localhost \
  --dbport=5432 \
  --dbname=qazaq \
  --dbusername=qazaq \
  --dbpassword=changeme
```

This creates the `strapi/` directory with all boilerplate files. We will replace `strapi/config/database.ts` and add content types.

- [ ] **Step 2: Replace `strapi/config/database.ts`**

```typescript
export default ({ env }: { env: (key: string) => string }) => ({
  connection: {
    client: "postgres",
    connection: {
      host: env("DATABASE_HOST"),
      port: parseInt(env("DATABASE_PORT") || "5432"),
      database: env("DATABASE_NAME"),
      user: env("DATABASE_USERNAME"),
      password: env("DATABASE_PASSWORD"),
      ssl: false,
    },
  },
});
```

- [ ] **Step 3: Create `strapi/src/api/theory/content-types/theory/schema.json`**

```json
{
  "kind": "collectionType",
  "collectionName": "theories",
  "info": {
    "singularName": "theory",
    "pluralName": "theories",
    "displayName": "Theory"
  },
  "options": { "draftAndPublish": true },
  "attributes": {
    "title": { "type": "string", "required": true },
    "content": { "type": "richtext", "required": true },
    "order": { "type": "integer", "default": 0 }
  }
}
```

- [ ] **Step 4: Create `strapi/src/api/theory/controllers/theory.ts`**

```typescript
import { factories } from "@strapi/strapi";
export default factories.createCoreController("api::theory.theory");
```

- [ ] **Step 5: Create `strapi/src/api/theory/services/theory.ts`**

```typescript
import { factories } from "@strapi/strapi";
export default factories.createCoreService("api::theory.theory");
```

- [ ] **Step 6: Create `strapi/src/api/theory/routes/theory.ts`**

```typescript
import { factories } from "@strapi/strapi";
export default factories.createCoreRouter("api::theory.theory");
```

- [ ] **Step 7: Create `strapi/src/api/video/content-types/video/schema.json`**

```json
{
  "kind": "collectionType",
  "collectionName": "videos",
  "info": {
    "singularName": "video",
    "pluralName": "videos",
    "displayName": "Video"
  },
  "options": { "draftAndPublish": true },
  "attributes": {
    "title": { "type": "string", "required": true },
    "url": { "type": "string", "required": true },
    "description": { "type": "text" }
  }
}
```

- [ ] **Step 8: Create video controllers/services/routes (same pattern as theory)**

`strapi/src/api/video/controllers/video.ts`:
```typescript
import { factories } from "@strapi/strapi";
export default factories.createCoreController("api::video.video");
```

`strapi/src/api/video/services/video.ts`:
```typescript
import { factories } from "@strapi/strapi";
export default factories.createCoreService("api::video.video");
```

`strapi/src/api/video/routes/video.ts`:
```typescript
import { factories } from "@strapi/strapi";
export default factories.createCoreRouter("api::video.video");
```

- [ ] **Step 9: Create `strapi/src/api/test-question/content-types/test-question/schema.json`**

```json
{
  "kind": "collectionType",
  "collectionName": "test_questions",
  "info": {
    "singularName": "test-question",
    "pluralName": "test-questions",
    "displayName": "Test Question"
  },
  "options": { "draftAndPublish": true },
  "attributes": {
    "question": { "type": "string", "required": true },
    "optionA": { "type": "string", "required": true },
    "optionB": { "type": "string", "required": true },
    "optionC": { "type": "string", "required": true },
    "optionD": { "type": "string", "required": true },
    "correctOption": {
      "type": "enumeration",
      "enum": ["A", "B", "C", "D"],
      "required": true
    },
    "explanation": { "type": "text" }
  }
}
```

- [ ] **Step 10: Create test-question controllers/services/routes**

`strapi/src/api/test-question/controllers/test-question.ts`:
```typescript
import { factories } from "@strapi/strapi";
export default factories.createCoreController("api::test-question.test-question");
```

`strapi/src/api/test-question/services/test-question.ts`:
```typescript
import { factories } from "@strapi/strapi";
export default factories.createCoreService("api::test-question.test-question");
```

`strapi/src/api/test-question/routes/test-question.ts`:
```typescript
import { factories } from "@strapi/strapi";
export default factories.createCoreRouter("api::test-question.test-question");
```

- [ ] **Step 11: Create `strapi/src/api/exercise/content-types/exercise/schema.json`**

Note: `optionA`–`optionD` are optional — only needed when `type` is `"choice"`.

```json
{
  "kind": "collectionType",
  "collectionName": "exercises",
  "info": {
    "singularName": "exercise",
    "pluralName": "exercises",
    "displayName": "Exercise"
  },
  "options": { "draftAndPublish": true },
  "attributes": {
    "type": {
      "type": "enumeration",
      "enum": ["suffix", "choice", "fill_blank"],
      "required": true
    },
    "prompt": { "type": "text", "required": true },
    "answer": { "type": "string", "required": true },
    "explanation": { "type": "text" },
    "optionA": { "type": "string" },
    "optionB": { "type": "string" },
    "optionC": { "type": "string" },
    "optionD": { "type": "string" },
    "image": {
      "allowedTypes": ["images"],
      "type": "media",
      "multiple": false
    }
  }
}
```

- [ ] **Step 12: Create exercise controllers/services/routes**

`strapi/src/api/exercise/controllers/exercise.ts`:
```typescript
import { factories } from "@strapi/strapi";
export default factories.createCoreController("api::exercise.exercise");
```

`strapi/src/api/exercise/services/exercise.ts`:
```typescript
import { factories } from "@strapi/strapi";
export default factories.createCoreService("api::exercise.exercise");
```

`strapi/src/api/exercise/routes/exercise.ts`:
```typescript
import { factories } from "@strapi/strapi";
export default factories.createCoreRouter("api::exercise.exercise");
```

- [ ] **Step 13: Create `strapi/Dockerfile`**

```dockerfile
FROM node:24-alpine
WORKDIR /opt/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 1337
CMD ["npm", "start"]
```

- [ ] **Step 14: Commit**

```bash
git add strapi/
git commit -m "feat: strapi v5 project with content type schemas"
```

---

## Task 3: Bot project scaffold

**Files:**
- Create: `bot/package.json`
- Create: `bot/tsconfig.json`
- Create: `bot/jest.config.js`
- Create: `bot/src/config.ts`

- [ ] **Step 1: Create `bot/package.json`**

```json
{
  "name": "qazaq-undestik-bot",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test": "jest",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.26.0",
    "@grammyjs/conversations": "^1.2.0",
    "@prisma/client": "^5.18.0",
    "dotenv": "^16.4.5",
    "grammy": "^1.28.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^20.14.0",
    "jest": "^29.7.0",
    "nock": "^13.5.4",
    "prisma": "^5.18.0",
    "ts-jest": "^29.2.3",
    "tsx": "^4.16.2",
    "typescript": "^5.5.4"
  }
}
```

- [ ] **Step 2: Create `bot/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `bot/jest.config.js`**

```js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js"],
};
```

- [ ] **Step 4: Create `bot/src/config.ts`**

```typescript
import "dotenv/config";

function require_env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

export const config = {
  BOT_TOKEN: require_env("BOT_TOKEN"),
  ANTHROPIC_API_KEY: require_env("ANTHROPIC_API_KEY"),
  DATABASE_URL: require_env("DATABASE_URL"),
  STRAPI_URL: require_env("STRAPI_URL"),
  STRAPI_API_TOKEN: require_env("STRAPI_API_TOKEN"),
};
```

- [ ] **Step 5: Install dependencies**

```bash
cd bot && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Verify TypeScript compiles (no src files yet, just check tsconfig)**

```bash
cd bot && npx tsc --noEmit 2>&1 || true
```

Expected: either no output or "error TS18003: No inputs" — both are fine at this stage.

- [ ] **Step 7: Commit**

```bash
git add bot/package.json bot/tsconfig.json bot/jest.config.js bot/src/config.ts
git commit -m "feat: bot project scaffold with config"
```

---

## Task 4: Prisma schema + DB client

**Files:**
- Create: `bot/prisma/schema.prisma`
- Create: `bot/src/db/prisma.ts`
- Test: `bot/src/db/__tests__/prisma.test.ts`

- [ ] **Step 1: Write the failing test**

Create `bot/src/db/__tests__/prisma.test.ts`:

```typescript
import { prisma } from "../prisma";

describe("prisma client", () => {
  it("exports a PrismaClient instance", () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd bot && npx jest src/db/__tests__/prisma.test.ts --no-coverage
```

Expected: FAIL — "Cannot find module '../prisma'"

- [ ] **Step 3: Create `bot/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              BigInt           @id
  username        String?
  createdAt       DateTime         @default(now())
  testResults     TestResult[]
  exerciseResults ExerciseResult[]
}

model TestResult {
  id        Int      @id @default(autoincrement())
  userId    BigInt
  score     Int
  total     Int
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model ExerciseResult {
  id         Int      @id @default(autoincrement())
  userId     BigInt
  exerciseId Int
  isCorrect  Boolean
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
}
```

- [ ] **Step 4: Generate Prisma client**

```bash
cd bot && npx prisma generate
```

Expected: "Generated Prisma Client" success message.

- [ ] **Step 5: Create `bot/src/db/prisma.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd bot && npx jest src/db/__tests__/prisma.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add bot/prisma/schema.prisma bot/src/db/ 
git commit -m "feat: prisma schema and db client singleton"
```

---

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd bot && npx jest src/services/__tests__/strapi.test.ts --no-coverage
```

Expected: FAIL — "Cannot find module '../strapi'"

- [ ] **Step 3: Create `bot/src/services/strapi.ts`**

```typescript
import { config } from "../config";

// Strapi v5 REST API returns data without nested `attributes`
export interface TheoryItem {
  id: number;
  title: string;
  content: string;
  order: number;
}

export interface VideoItem {
  id: number;
  title: string;
  url: string;
  description: string;
}

export interface TestQuestion {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface Exercise {
  id: number;
  type: "suffix" | "choice" | "fill_blank";
  prompt: string;
  answer: string;
  explanation: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  image?: { url: string };
}

async function strapiGet<T>(path: string, params: Record<string, string> = {}): Promise<T[]> {
  const url = new URL(`${config.STRAPI_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${config.STRAPI_API_TOKEN}` },
  });

  if (!res.ok) {
    throw new Error(`Strapi error ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { data: T[] };
  return json.data;
}

export const strapiService = {
  async getTheory(): Promise<TheoryItem[]> {
    return strapiGet<TheoryItem>("/api/theories", {
      "sort[0]": "order:asc",
      "pagination[pageSize]": "100",
      "filters[publishedAt][$notNull]": "true",
    });
  },

  async getVideos(): Promise<VideoItem[]> {
    return strapiGet<VideoItem>("/api/videos", {
      "pagination[pageSize]": "100",
      "filters[publishedAt][$notNull]": "true",
    });
  },

  async getTestQuestions(): Promise<TestQuestion[]> {
    return strapiGet<TestQuestion>("/api/test-questions", {
      "pagination[pageSize]": "100",
      "filters[publishedAt][$notNull]": "true",
    });
  },

  async getExercises(): Promise<Exercise[]> {
    return strapiGet<Exercise>("/api/exercises", {
      "pagination[pageSize]": "100",
      "populate": "image",
      "filters[publishedAt][$notNull]": "true",
    });
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd bot && npx jest src/services/__tests__/strapi.test.ts --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add bot/src/services/strapi.ts bot/src/services/__tests__/strapi.test.ts
git commit -m "feat: strapi HTTP service with tests"
```

---

## Task 6: Progress service + tests

**Files:**
- Create: `bot/src/services/progress.ts`
- Create: `bot/src/services/__tests__/progress.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `bot/src/services/__tests__/progress.test.ts`:

```typescript
import { progressService } from "../progress";
import { prisma } from "../../db/prisma";

jest.mock("../../db/prisma", () => ({
  prisma: {
    user: {
      upsert: jest.fn(),
    },
    testResult: {
      create: jest.fn(),
    },
    exerciseResult: {
      create: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

beforeEach(() => jest.clearAllMocks());

describe("progressService.upsertUser", () => {
  it("calls prisma.user.upsert with correct args", async () => {
    (mockedPrisma.user.upsert as jest.Mock).mockResolvedValue({});
    await progressService.upsertUser(BigInt(123), "alice");
    expect(mockedPrisma.user.upsert).toHaveBeenCalledWith({
      where: { id: BigInt(123) },
      update: { username: "alice" },
      create: { id: BigInt(123), username: "alice" },
    });
  });
});

describe("progressService.saveTestResult", () => {
  it("calls prisma.testResult.create with correct args", async () => {
    (mockedPrisma.testResult.create as jest.Mock).mockResolvedValue({});
    await progressService.saveTestResult(BigInt(123), 7, 10);
    expect(mockedPrisma.testResult.create).toHaveBeenCalledWith({
      data: { userId: BigInt(123), score: 7, total: 10 },
    });
  });
});

describe("progressService.saveExerciseResult", () => {
  it("calls prisma.exerciseResult.create with correct args", async () => {
    (mockedPrisma.exerciseResult.create as jest.Mock).mockResolvedValue({});
    await progressService.saveExerciseResult(BigInt(123), 5, true);
    expect(mockedPrisma.exerciseResult.create).toHaveBeenCalledWith({
      data: { userId: BigInt(123), exerciseId: 5, isCorrect: true },
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd bot && npx jest src/services/__tests__/progress.test.ts --no-coverage
```

Expected: FAIL — "Cannot find module '../progress'"

- [ ] **Step 3: Create `bot/src/services/progress.ts`**

```typescript
import { prisma } from "../db/prisma";

export const progressService = {
  async upsertUser(userId: bigint, username?: string): Promise<void> {
    await prisma.user.upsert({
      where: { id: userId },
      update: { username: username ?? null },
      create: { id: userId, username: username ?? null },
    });
  },

  async saveTestResult(userId: bigint, score: number, total: number): Promise<void> {
    await prisma.testResult.create({
      data: { userId, score, total },
    });
  },

  async saveExerciseResult(userId: bigint, exerciseId: number, isCorrect: boolean): Promise<void> {
    await prisma.exerciseResult.create({
      data: { userId, exerciseId, isCorrect },
    });
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd bot && npx jest src/services/__tests__/progress.test.ts --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add bot/src/services/progress.ts bot/src/services/__tests__/progress.test.ts
git commit -m "feat: progress service with tests"
```

---

## Task 7: AI service + tests

**Files:**
- Create: `bot/src/services/ai.ts`
- Create: `bot/src/services/__tests__/ai.test.ts`

- [ ] **Step 1: Write the failing test**

Create `bot/src/services/__tests__/ai.test.ts`:

```typescript
import { aiService } from "../ai";

// Mock @anthropic-ai/sdk
jest.mock("@anthropic-ai/sdk", () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: "text", text: "Тест жауабы" }],
      }),
    },
  })),
}));

describe("aiService.ask", () => {
  it("returns text from Claude response", async () => {
    const answer = await aiService.ask("Үндестік заңы дегеніміз не?");
    expect(answer).toBe("Тест жауабы");
  });

  it("throws if no text content returned", async () => {
    const Anthropic = require("@anthropic-ai/sdk").default;
    Anthropic.mockImplementationOnce(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({ content: [] }),
      },
    }));

    await expect(aiService.ask("Сұрақ")).rejects.toThrow("No text content in AI response");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd bot && npx jest src/services/__tests__/ai.test.ts --no-coverage
```

Expected: FAIL — "Cannot find module '../ai'"

- [ ] **Step 3: Create `bot/src/services/ai.ts`**

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";

const SYSTEM_PROMPT =
  "Сен 5-сынып оқушыларына арналған оқыту ботысың. Тақырып: қазақ тілінің үндестік заңы. " +
  "Тек осы тақырып бойынша қазақша жауап бер, қысқа және түсінікті етіп.";

const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

export const aiService = {
  async ask(userMessage: string): Promise<string> {
    const response = await client.messages.create({
      model: "claude-haiku-20240307",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text content in AI response");
    }
    return textBlock.text;
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd bot && npx jest src/services/__tests__/ai.test.ts --no-coverage
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add bot/src/services/ai.ts bot/src/services/__tests__/ai.test.ts
git commit -m "feat: AI service wrapping Claude Haiku"
```

---

## Task 8: Keyboards

**Files:**
- Create: `bot/src/keyboards/menus.ts`

- [ ] **Step 1: Create `bot/src/keyboards/menus.ts`**

```typescript
import { InlineKeyboard, Keyboard } from "grammy";

export const mainMenuKeyboard = new Keyboard()
  .text("📚 Теория").text("📹 Видео").row()
  .text("✏️ Жаттығу").text("📝 Тест").row()
  .text("❓ Сұрақ қою")
  .resized();

export const backToMenuInline = new InlineKeyboard()
  .text("⬅️ Мәзірге оралу", "menu");
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd bot && npx tsc --noEmit
```

Expected: no errors (or only errors about missing `src/index.ts` which doesn't exist yet)

- [ ] **Step 3: Commit**

```bash
git add bot/src/keyboards/menus.ts
git commit -m "feat: main menu and back button keyboards"
```

---

## Task 9: Bot entry point + /start handler

**Files:**
- Create: `bot/src/handlers/start.ts`
- Create: `bot/src/index.ts`

- [ ] **Step 1: Create `bot/src/handlers/start.ts`**

```typescript
import { type MyContext } from "../index";
import { mainMenuKeyboard } from "../keyboards/menus";
import { progressService } from "../services/progress";

export async function handleStart(ctx: MyContext): Promise<void> {
  const userId = BigInt(ctx.from!.id);
  const username = ctx.from?.username;
  await progressService.upsertUser(userId, username);

  await ctx.reply(
    "Сәлем! Мен үндестік заңын үйретемін 📚\n\nТөмендегі мәзірден бөлімді таңдаңыз:",
    { reply_markup: mainMenuKeyboard }
  );
}
```

- [ ] **Step 2: Create `bot/src/index.ts`**

```typescript
import "dotenv/config";
import { Bot, Context, session, SessionFlavor } from "grammy";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { config } from "./config";
import { handleStart } from "./handlers/start";
import { theoryConversation } from "./handlers/theory";
import { videoConversation } from "./handlers/video";
import { exercisesConversation } from "./handlers/exercises";
import { testsConversation } from "./handlers/tests";
import { aiChatConversation } from "./handlers/aiChat";

type SessionData = Record<string, never>;
export type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;
export type MyConversation = Conversation<MyContext>;

const bot = new Bot<MyContext>(config.BOT_TOKEN);

bot.use(session({ initial: (): SessionData => ({}) }));
bot.use(conversations());

bot.use(createConversation(theoryConversation, "theory"));
bot.use(createConversation(videoConversation, "video"));
bot.use(createConversation(exercisesConversation, "exercises"));
bot.use(createConversation(testsConversation, "tests"));
bot.use(createConversation(aiChatConversation, "aiChat"));

bot.command("start", handleStart);
bot.hears("📚 Теория", (ctx) => ctx.conversation.enter("theory"));
bot.hears("📹 Видео", (ctx) => ctx.conversation.enter("video"));
bot.hears("✏️ Жаттығу", (ctx) => ctx.conversation.enter("exercises"));
bot.hears("📝 Тест", (ctx) => ctx.conversation.enter("tests"));
bot.hears("❓ Сұрақ қою", (ctx) => ctx.conversation.enter("aiChat"));

bot.catch((err) => {
  console.error("Bot error:", err);
});

bot.start();
console.log("Bot started");
```

- [ ] **Step 3: Verify TypeScript compiles (handler files don't exist yet — expect import errors)**

```bash
cd bot && npx tsc --noEmit 2>&1 | head -20
```

Expected: errors about missing handler modules (theory, video, exercises, tests, aiChat). That is expected at this stage.

- [ ] **Step 4: Commit**

```bash
git add bot/src/handlers/start.ts bot/src/index.ts
git commit -m "feat: bot entry point and start handler"
```

---

## Task 10: Theory handler

**Files:**
- Create: `bot/src/handlers/theory.ts`

- [ ] **Step 1: Create `bot/src/handlers/theory.ts`**

```typescript
import { InlineKeyboard } from "grammy";
import { type MyConversation, type MyContext } from "../index";
import { strapiService } from "../services/strapi";
import { backToMenuInline } from "../keyboards/menus";

export async function theoryConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const items = await conversation.external(() => strapiService.getTheory());

  if (items.length === 0) {
    await ctx.reply("Теория материалдары әлі жоқ.");
    await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
    await conversation.waitForCallbackQuery("menu");
    return;
  }

  const kb = new InlineKeyboard();
  items.forEach((item, i) => {
    kb.text(item.title, `t_${item.id}`);
    if (i % 2 === 1) kb.row();
  });
  kb.row().text("⬅️ Мәзірге оралу", "menu");

  await ctx.reply("Тақырыпты таңдаңыз:", { reply_markup: kb });

  const callbackData = items.map((i) => `t_${i.id}`);
  const selection = await conversation.waitForCallbackQuery([...callbackData, "menu"]);
  await selection.answerCallbackQuery();

  if (selection.callbackQuery.data === "menu") return;

  const itemId = parseInt(selection.callbackQuery.data.replace("t_", ""));
  const item = items.find((i) => i.id === itemId);

  if (item) {
    await ctx.reply(`*${item.title}*\n\n${item.content}`, { parse_mode: "Markdown" });
  }

  await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
  await conversation.waitForCallbackQuery("menu");
}
```

- [ ] **Step 2: Verify TypeScript compiles (still expect errors for missing video/exercises/tests/aiChat)**

```bash
cd bot && npx tsc --noEmit 2>&1 | grep -v "theory\|start\|menus\|prisma\|strapi\|progress\|ai\b" | head -20
```

Expected: fewer errors now.

- [ ] **Step 3: Commit**

```bash
git add bot/src/handlers/theory.ts
git commit -m "feat: theory conversation handler"
```

---

## Task 11: Video handler

**Files:**
- Create: `bot/src/handlers/video.ts`

- [ ] **Step 1: Create `bot/src/handlers/video.ts`**

```typescript
import { type MyConversation, type MyContext } from "../index";
import { strapiService } from "../services/strapi";
import { backToMenuInline } from "../keyboards/menus";

export async function videoConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const videos = await conversation.external(() => strapiService.getVideos());

  if (videos.length === 0) {
    await ctx.reply("Видеолар әлі жоқ.");
    await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
    await conversation.waitForCallbackQuery("menu");
    return;
  }

  for (const video of videos) {
    const text =
      `📹 *${video.title}*\n` +
      (video.description ? `${video.description}\n\n` : "") +
      `🔗 ${video.url}`;
    await ctx.reply(text, { parse_mode: "Markdown" });
  }

  await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
  await conversation.waitForCallbackQuery("menu");
}
```

- [ ] **Step 2: Commit**

```bash
git add bot/src/handlers/video.ts
git commit -m "feat: video conversation handler"
```

---

## Task 12: Exercise handler

**Files:**
- Create: `bot/src/handlers/exercises.ts`

- [ ] **Step 1: Create `bot/src/handlers/exercises.ts`**

```typescript
import { InlineKeyboard } from "grammy";
import { type MyConversation, type MyContext } from "../index";
import { strapiService, type Exercise } from "../services/strapi";
import { progressService } from "../services/progress";
import { backToMenuInline } from "../keyboards/menus";

async function showExercise(ctx: MyContext, exercise: Exercise): Promise<void> {
  const text = `✏️ *Жаттығу*\n\n${exercise.prompt}`;
  if (exercise.image?.url) {
    await ctx.replyWithPhoto(exercise.image.url, {
      caption: text,
      parse_mode: "Markdown",
    });
  } else {
    await ctx.reply(text, { parse_mode: "Markdown" });
  }
}

async function getAnswer(
  conversation: MyConversation,
  ctx: MyContext,
  exercise: Exercise
): Promise<string> {
  if (exercise.type === "choice") {
    const kb = new InlineKeyboard()
      .text(`A. ${exercise.optionA ?? ""}`, "A")
      .text(`B. ${exercise.optionB ?? ""}`, "B")
      .row()
      .text(`C. ${exercise.optionC ?? ""}`, "C")
      .text(`D. ${exercise.optionD ?? ""}`, "D");
    await ctx.reply("Жауапты таңдаңыз:", { reply_markup: kb });
    const cb = await conversation.waitForCallbackQuery(["A", "B", "C", "D"]);
    await cb.answerCallbackQuery();
    return cb.callbackQuery.data;
  } else {
    await ctx.reply("Жауабыңызды жазыңыз:");
    const msg = await conversation.waitFor("message:text");
    return msg.message.text.trim().toLowerCase();
  }
}

export async function exercisesConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const exercises = await conversation.external(() => strapiService.getExercises());

  if (exercises.length === 0) {
    await ctx.reply("Жаттығулар әлі жоқ.");
    await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
    await conversation.waitForCallbackQuery("menu");
    return;
  }

  const userId = BigInt(ctx.from!.id);

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];

    await showExercise(ctx, exercise);
    const userAnswer = await getAnswer(conversation, ctx, exercise);

    const correctAnswer =
      exercise.type === "choice"
        ? exercise.answer.toUpperCase()
        : exercise.answer.trim().toLowerCase();

    const normalizedUser =
      exercise.type === "choice" ? userAnswer.toUpperCase() : userAnswer;

    const isCorrect = normalizedUser === correctAnswer;

    await conversation.external(() =>
      progressService.saveExerciseResult(userId, exercise.id, isCorrect)
    );

    if (isCorrect) {
      await ctx.reply(`✅ Дұрыс!\n\n${exercise.explanation ?? ""}`);
    } else {
      await ctx.reply(
        `❌ Қате. Дұрыс жауап: *${exercise.answer}*\n\n${exercise.explanation ?? ""}`,
        { parse_mode: "Markdown" }
      );
    }

    if (i < exercises.length - 1) {
      const navKb = new InlineKeyboard()
        .text("➡️ Келесі жаттығу", "next")
        .text("⬅️ Мәзір", "menu");
      await ctx.reply("Жалғастырасыз ба?", { reply_markup: navKb });
      const nav = await conversation.waitForCallbackQuery(["next", "menu"]);
      await nav.answerCallbackQuery();
      if (nav.callbackQuery.data === "menu") return;
    }
  }

  await ctx.reply("🎉 Барлық жаттығулар аяқталды!");
  await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
  await conversation.waitForCallbackQuery("menu");
}
```

- [ ] **Step 2: Commit**

```bash
git add bot/src/handlers/exercises.ts
git commit -m "feat: exercises conversation handler"
```

---

## Task 13: Test handler

**Files:**
- Create: `bot/src/handlers/tests.ts`

- [ ] **Step 1: Create `bot/src/handlers/tests.ts`**

```typescript
import { InlineKeyboard } from "grammy";
import { type MyConversation, type MyContext } from "../index";
import { strapiService, type TestQuestion } from "../services/strapi";
import { progressService } from "../services/progress";
import { backToMenuInline } from "../keyboards/menus";

export async function testsConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const questions = await conversation.external(() => strapiService.getTestQuestions());

  if (questions.length === 0) {
    await ctx.reply("Тест сұрақтары әлі жоқ.");
    await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
    await conversation.waitForCallbackQuery("menu");
    return;
  }

  await ctx.reply(`📝 Тест басталды! ${questions.length} сұрақ бар.`);

  let score = 0;
  const results: Array<{
    question: TestQuestion;
    userAnswer: string;
    isCorrect: boolean;
  }> = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const kb = new InlineKeyboard()
      .text(`A. ${q.optionA}`, "A")
      .text(`B. ${q.optionB}`, "B")
      .row()
      .text(`C. ${q.optionC}`, "C")
      .text(`D. ${q.optionD}`, "D");

    await ctx.reply(
      `*Сұрақ ${i + 1}/${questions.length}*\n\n${q.question}`,
      { parse_mode: "Markdown", reply_markup: kb }
    );

    const cb = await conversation.waitForCallbackQuery(["A", "B", "C", "D"]);
    await cb.answerCallbackQuery();
    const userAnswer = cb.callbackQuery.data as "A" | "B" | "C" | "D";

    const isCorrect = userAnswer === q.correctOption;
    if (isCorrect) score++;
    results.push({ question: q, userAnswer, isCorrect });
  }

  // Show score
  const percent = Math.round((score / questions.length) * 100);
  await ctx.reply(
    `📊 *Нәтиже: ${score} / ${questions.length} (${percent}%)*`,
    { parse_mode: "Markdown" }
  );

  // Show explanations
  for (const r of results) {
    const status = r.isCorrect ? "✅" : "❌";
    const text =
      `${status} ${r.question.question}\n` +
      `Сіздің жауабыңыз: *${r.userAnswer}* | Дұрыс: *${r.question.correctOption}*` +
      (r.question.explanation ? `\n\n${r.question.explanation}` : "");
    await ctx.reply(text, { parse_mode: "Markdown" });
  }

  // Save result
  const userId = BigInt(ctx.from!.id);
  await conversation.external(() =>
    progressService.saveTestResult(userId, score, questions.length)
  );

  await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
  await conversation.waitForCallbackQuery("menu");
}
```

- [ ] **Step 2: Commit**

```bash
git add bot/src/handlers/tests.ts
git commit -m "feat: tests conversation handler"
```

---

## Task 14: AI Chat handler

**Files:**
- Create: `bot/src/handlers/aiChat.ts`

- [ ] **Step 1: Create `bot/src/handlers/aiChat.ts`**

```typescript
import { InlineKeyboard } from "grammy";
import { type MyConversation, type MyContext } from "../index";
import { aiService } from "../services/ai";

export async function aiChatConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const exitKb = new InlineKeyboard().text("⬅️ Мәзірге оралу", "menu");

  await ctx.reply(
    "❓ Сұрағыңызды жазыңыз. Мен үндестік заңы туралы қазақша жауап беремін.\n" +
    "Шығу үшін төмендегі батырманы басыңыз.",
    { reply_markup: exitKb }
  );

  // Loop: accept questions until user presses "menu" button
  while (true) {
    const update = await conversation.waitUntil(
      (c) =>
        (c.callbackQuery?.data === "menu") ||
        (c.message?.text !== undefined)
    );

    if (update.callbackQuery?.data === "menu") {
      await update.answerCallbackQuery();
      return;
    }

    const userQuestion = update.message!.text!;

    await ctx.reply("⏳ Жауап іздеуде...");

    let answer: string;
    try {
      answer = await conversation.external(() => aiService.ask(userQuestion));
    } catch {
      answer = "Кешіріңіз, қате пайда болды. Қайтадан сұраңыз.";
    }

    await ctx.reply(answer, { reply_markup: exitKb });
  }
}
```

- [ ] **Step 2: Verify ALL TypeScript compiles cleanly**

```bash
cd bot && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add bot/src/handlers/aiChat.ts
git commit -m "feat: AI chat conversation handler"
```

---

## Task 15: Bot Dockerfile + full test suite

**Files:**
- Create: `bot/Dockerfile`
- Create: `bot/.dockerignore`

- [ ] **Step 1: Run the full test suite**

```bash
cd bot && npx jest --no-coverage
```

Expected: all tests PASS (9 tests across 3 test files).

- [ ] **Step 2: Create `bot/Dockerfile`**

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate
COPY tsconfig.json .
COPY src ./src
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

- [ ] **Step 3: Create `bot/.dockerignore`**

```
node_modules
dist
.env
*.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add bot/Dockerfile bot/.dockerignore
git commit -m "feat: bot Dockerfile with prisma migrate on startup"
```

---

## Task 16: Strapi admin setup + API token (manual)

> This task is done once by a human in a browser. It cannot be automated.

- [ ] **Step 1: Start infrastructure**

```bash
# From project root
docker compose up postgres strapi
```

Wait until Strapi logs show "Server started".

- [ ] **Step 2: Create admin account**

Open `http://localhost:1337/admin` in browser. Register an admin account.

- [ ] **Step 3: Set collection permissions for the API token**

Go to: Settings → API Tokens → Create new API Token
- Name: `Bot Read Token`
- Token duration: Unlimited
- Token type: Read-only

Click "Regenerate" and copy the token. Set it in `.env`:
```
STRAPI_API_TOKEN=<copied token>
```

- [ ] **Step 4: Add sample content for testing**

Go to Content Manager → Theory → Create entry:
- Title: `Үндестік заңы — кіріспе`
- Content: `Үндестік заңы — бұл қазақ тілінде дыбыстардың бір-біріне ықпал ету заңдылығы.`
- Order: `1`
- Click "Publish"

Go to Content Manager → Video → Create entry:
- Title: `Үндестік заңы (YouTube)`
- URL: `https://www.youtube.com/watch?v=example`
- Description: `Видео сабақ`
- Click "Publish"

Go to Content Manager → Test Question → Create entry:
- Question: `Қандай дыбыс буын үндестігіне жатады?`
- optionA: `Дауысты`
- optionB: `Үнді`
- optionC: `Ұяң`
- optionD: `Қатаң`
- correctOption: `A`
- Explanation: `Буын үндестігі дауысты дыбыстарға қатысты.`
- Click "Publish"

Go to Content Manager → Exercise → Create entry:
- Type: `fill_blank`
- Prompt: `Бос орынды толтырыңыз: «кіт___» (кітап сөзін жазыңыз)`
- Answer: `кітап`
- Explanation: `Дұрыс жауап — кітап`
- Click "Publish"

- [ ] **Step 5: Start the bot and verify end-to-end**

```bash
docker compose up
```

In Telegram: send `/start` to the bot. Verify all 5 menu buttons work.

---

## Task 17: Deployment to Digital Ocean

- [ ] **Step 1: Create droplet**

Use Digital Ocean dashboard to create a droplet:
- OS: Ubuntu 24.04 LTS
- Size: Basic $12/mo (2GB RAM minimum — Strapi needs ~1GB)
- Region: closest to Kazakhstan (Frankfurt or Amsterdam)

- [ ] **Step 2: Install Docker on droplet**

```bash
# SSH into droplet
ssh root@<droplet-ip>

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

- [ ] **Step 3: Copy project to droplet**

```bash
# From local machine
scp -r . root@<droplet-ip>:/opt/qazaq-undestik-bot
# Or use git clone if repo is on GitHub
```

- [ ] **Step 4: Set production `.env` on droplet**

```bash
ssh root@<droplet-ip>
cd /opt/qazaq-undestik-bot
cp .env.example .env
nano .env   # fill in all values
```

- [ ] **Step 5: Build and start**

```bash
docker compose up --build -d
```

- [ ] **Step 6: Verify logs are clean**

```bash
docker compose logs -f bot
```

Expected: "Bot started" with no errors.

- [ ] **Step 7: Configure Strapi API token in production**

Open `http://<droplet-ip>:1337/admin`, create admin account, create API token, copy token into `.env` → `STRAPI_API_TOKEN`, then restart:

```bash
docker compose restart bot
```

- [ ] **Step 8: Final smoke test**

Send `/start` to the bot in Telegram. Test all 5 sections. Verify content from Strapi appears correctly.

---

## Self-Review

### Spec coverage

| Spec requirement | Covered in |
|---|---|
| /start + main menu | Task 9 |
| Theory section | Task 10 |
| Video section | Task 11 |
| Exercises (suffix, choice, fill_blank) | Task 12 |
| Test section with score | Task 13 |
| AI Q&A via Claude Haiku | Task 14 |
| Content via Strapi CMS | Tasks 2, 16 |
| Progress saved to PostgreSQL | Tasks 4, 6 |
| Docker Compose deployment | Tasks 1, 15 |
| Kazakh interface language | All handlers |
| Teacher admin panel | Tasks 2, 16 |

### Acceptance criteria check

- [x] Bot responds to `/start` and shows main menu — Task 9
- [x] All 5 sections work — Tasks 10–14
- [x] CMS content appears in bot — Tasks 2, 5
- [x] AI answers in Kazakh for 5th grade — Task 7 (system prompt)
- [x] CMS accessible — Task 16
- [x] Bot runs stably — Docker Compose health checks (Task 1)
