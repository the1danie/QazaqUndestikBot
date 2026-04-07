# Strapi → Next.js Migration Design

**Date:** 2026-04-07  
**Project:** QazaqUndestikBot

## Overview

Remove Strapi completely. The existing Next.js admin app becomes the single backend — it serves both the admin UI and a bot API. All data (content + user progress) lives in PostgreSQL managed by Prisma in the admin app. The bot stops using Prisma and Strapi directly; it calls the Admin API over HTTP instead.

---

## Architecture

**Before:**
```
Bot → Strapi API (:1337) → PostgreSQL (strapi tables)
Bot → Prisma → PostgreSQL (bot tables)
Admin UI → Strapi API
Docker: postgres + strapi + bot + admin = 4 services
```

**After:**
```
Bot → Admin API (:3000/api/bot/*) → Prisma → PostgreSQL
Admin UI → Prisma → PostgreSQL
Docker: postgres + admin + bot = 3 services
```

---

## Prisma Schema (admin/prisma/schema.prisma)

All models move into the admin app. The bot's `bot/prisma/` folder is deleted.

### Content models (from Strapi)

```prisma
model Theory {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  order     Int      @default(0)
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Exercise {
  id            Int      @id @default(autoincrement())
  type          String   // "suffix" | "choice" | "fill_blank"
  prompt        String
  answer        String
  correctOption String?  // "A" | "B" | "C" | "D"
  optionA       String?
  optionB       String?
  optionC       String?
  optionD       String?
  explanation   String?
  published     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Task {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  order     Int      @default(0)
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model TestQuestion {
  id            Int      @id @default(autoincrement())
  question      String
  optionA       String
  optionB       String
  optionC       String
  optionD       String
  correctOption String   // "A" | "B" | "C" | "D"
  explanation   String?
  published     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Video {
  id          Int      @id @default(autoincrement())
  title       String
  url         String
  description String?
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### User progress models (from bot Prisma + Strapi TelegramUser)

```prisma
model TelegramUser {
  id                 BigInt           @id  // Telegram user ID
  username           String?
  firstName          String?
  lastName           String?
  isBlocked          Boolean          @default(false)
  lastActiveAt       DateTime         @default(now())
  createdAt          DateTime         @default(now())
  testResults        TestResult[]
  exerciseResults    ExerciseResult[]
}

model TestResult {
  id        Int          @id @default(autoincrement())
  userId    BigInt
  score     Int
  total     Int
  createdAt DateTime     @default(now())
  user      TelegramUser @relation(fields: [userId], references: [id])
}

model ExerciseResult {
  id         Int          @id @default(autoincrement())
  userId     BigInt
  exerciseId Int
  isCorrect  Boolean
  createdAt  DateTime     @default(now())
  user       TelegramUser @relation(fields: [userId], references: [id])
}
```

---

## Admin API Routes for Bot

Protected by `ADMIN_BOT_SECRET` env var — bot sends it as `Authorization: Bearer <secret>` header.

### Content endpoints (GET, published only, sorted)

| Route | Returns |
|---|---|
| `GET /api/bot/theory` | `Theory[]` sorted by `order asc` |
| `GET /api/bot/exercises` | `Exercise[]` |
| `GET /api/bot/tasks` | `Task[]` sorted by `order asc` |
| `GET /api/bot/test-questions` | `TestQuestion[]` |
| `GET /api/bot/videos` | `Video[]` |

### User progress endpoints (POST)

| Route | Body | Action |
|---|---|---|
| `POST /api/bot/users/upsert` | `{ telegramId, username?, firstName?, lastName? }` | Create or update TelegramUser |
| `POST /api/bot/results/test` | `{ telegramId, score, total }` | Save TestResult |
| `POST /api/bot/results/exercise` | `{ telegramId, exerciseId, isCorrect }` | Save ExerciseResult |

All POST routes return `{ ok: true }` on success, `{ error: string }` with 4xx/5xx on failure.

---

## Bot Changes

- Delete `bot/prisma/` folder and all Prisma dependencies from `bot/package.json`
- Delete `bot/src/db/prisma.ts`
- Delete `bot/src/services/strapi.ts`
- Create `bot/src/services/adminApi.ts` — same interface as `strapi.ts`, calls Admin API
- Update `bot/src/services/progress.ts` — use `adminApi` instead of Prisma
- Remove `DATABASE_URL` from bot's env (bot no longer needs direct DB access)
- Add `ADMIN_URL` and `ADMIN_BOT_SECRET` to bot's env

### adminApi.ts interface (same methods, new implementation)

```typescript
adminApiService.getTheory(): Promise<TheoryItem[]>
adminApiService.getExercises(): Promise<Exercise[]>
adminApiService.getTasks(): Promise<Task[]>
adminApiService.getTestQuestions(): Promise<TestQuestion[]>
adminApiService.getVideos(): Promise<VideoItem[]>
adminApiService.upsertUser(telegramId, username?, firstName?, lastName?): Promise<void>
adminApiService.saveTestResult(telegramId, score, total): Promise<void>
adminApiService.saveExerciseResult(telegramId, exerciseId, isCorrect): Promise<void>
```

---

## Admin UI Changes

- Add `admin/prisma/schema.prisma` (moved from bot, extended with content models)
- Add Prisma client to admin: `npm install prisma @prisma/client`
- Replace `lib/strapi.ts` with `lib/db.ts` — Prisma client instance
- Update all API routes (`/api/erezhe`, `/api/tasks`, etc.) to use Prisma instead of Strapi fetch
- Update all list pages to use Prisma directly in server components
- Add `ADMIN_BOT_SECRET` to `.env`
- Remove `STRAPI_URL` and `STRAPI_API_TOKEN` from admin env

---

## Migration Script

`scripts/migrate.ts` — runs once before cutover:

1. **Read from Strapi API** — fetch all published + draft content from each endpoint
2. **Read from bot Prisma** — fetch all Users, TestResults, ExerciseResults
3. **Write to new DB via Prisma** — insert into admin's Prisma models, preserving IDs where possible

Run order:
```bash
# 1. Run migration (both old and new systems running)
cd scripts && npx ts-node migrate.ts

# 2. Verify data in new DB

# 3. Stop bot and Strapi
docker compose stop bot strapi

# 4. Start new stack
docker compose up -d

# 5. Verify bot works

# 6. Remove strapi/ folder from project
```

---

## Docker Compose Changes

**Remove:** `strapi` service  
**Modify `bot` service:**
- Remove `DATABASE_URL` env var
- Add `ADMIN_URL: http://admin:3000`
- Add `ADMIN_BOT_SECRET: ${ADMIN_BOT_SECRET}`

**Modify `admin` service:**
- Add `DATABASE_URL: postgresql://...` (same postgres, new schema prefix)
- Add `ADMIN_BOT_SECRET: ${ADMIN_BOT_SECRET}`

---

## Environment Variables

**Add to `.env`:**
```
ADMIN_BOT_SECRET=generate_with_openssl_rand_hex_32
```

**Remove from `.env`:**
```
STRAPI_APP_KEYS
STRAPI_API_TOKEN_SALT
STRAPI_ADMIN_JWT_SECRET
STRAPI_JWT_SECRET
STRAPI_TRANSFER_TOKEN_SALT
STRAPI_API_TOKEN
```

---

## Out of Scope

- Image/file uploads (exercise images) — keep using Strapi uploads or remove the feature
- Admin user management (still single user)
- Strapi admin UI (deleted entirely)
