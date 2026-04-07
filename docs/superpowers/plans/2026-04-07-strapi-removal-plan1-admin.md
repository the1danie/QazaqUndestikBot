# Strapi Removal — Plan 1: Admin Backend

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Strapi with Prisma inside the existing Next.js admin app — add Prisma schema, bot API routes, file uploads, and refactor all admin API routes and list pages to use Prisma instead of Strapi fetch.

**Architecture:** Admin gets its own `prisma/schema.prisma` with all content and user models. Admin API routes drop `lib/strapi.ts` and use the Prisma `db` client directly. New `/api/bot/*` routes serve the bot (Plan 2). New `/api/upload` and `/api/files/[filename]` handle images. Route params change from `[documentId]` (string) to `[id]` (number).

**Tech Stack:** Prisma 5, PostgreSQL, Next.js 14 App Router, Node.js `fs` for file uploads

---

## File Map

### New files
- `admin/prisma/schema.prisma` — unified schema (content + user progress)
- `admin/src/lib/db.ts` — Prisma client singleton
- `admin/src/lib/botAuth.ts` — bot request auth helper
- `admin/src/app/api/bot/theory/route.ts`
- `admin/src/app/api/bot/exercises/route.ts`
- `admin/src/app/api/bot/tasks/route.ts`
- `admin/src/app/api/bot/test-questions/route.ts`
- `admin/src/app/api/bot/videos/route.ts`
- `admin/src/app/api/bot/users/upsert/route.ts`
- `admin/src/app/api/bot/results/test/route.ts`
- `admin/src/app/api/bot/results/exercise/route.ts`
- `admin/src/app/api/upload/route.ts`
- `admin/src/app/api/files/[filename]/route.ts`

### Modified files
- `admin/package.json` — add prisma, @prisma/client
- `admin/next.config.ts` — add outputFileTracingIncludes for uploads dir
- `admin/src/types.ts` — replace Strapi types with Prisma-based types (id: number, published: boolean)
- `admin/src/app/api/erezhe/route.ts`
- `admin/src/app/api/erezhe/[documentId]/route.ts` → renamed to `[id]/route.ts`
- `admin/src/app/api/tasks/route.ts`
- `admin/src/app/api/tasks/[documentId]/route.ts` → renamed to `[id]/route.ts`
- `admin/src/app/api/exercises/route.ts`
- `admin/src/app/api/exercises/[documentId]/route.ts` → renamed to `[id]/route.ts`
- `admin/src/app/api/test-questions/route.ts`
- `admin/src/app/api/test-questions/[documentId]/route.ts` → renamed to `[id]/route.ts`
- `admin/src/app/api/videos/route.ts`
- `admin/src/app/api/videos/[documentId]/route.ts` → renamed to `[id]/route.ts`
- `admin/src/app/dashboard/erezhe/page.tsx`
- `admin/src/app/dashboard/erezhe/DeleteButton.tsx`
- `admin/src/app/dashboard/erezhe/[documentId]/page.tsx` → `[id]/page.tsx`
- `admin/src/app/dashboard/erezhe/[documentId]/EditErezheForm.tsx` → `[id]/EditErezheForm.tsx`
- `admin/src/app/dashboard/zhattyghu/page.tsx`
- `admin/src/app/dashboard/zhattyghu/DeleteTaskButton.tsx`
- `admin/src/app/dashboard/zhattyghu/DeleteExerciseButton.tsx`
- `admin/src/app/dashboard/zhattyghu/document/[documentId]/page.tsx` → `[id]/page.tsx`
- `admin/src/app/dashboard/zhattyghu/document/[documentId]/EditTaskForm.tsx` → `[id]/EditTaskForm.tsx`
- `admin/src/app/dashboard/zhattyghu/interactive/[documentId]/page.tsx` → `[id]/page.tsx`
- `admin/src/app/dashboard/zhattyghu/interactive/[documentId]/EditExerciseForm.tsx` → `[id]/EditExerciseForm.tsx`
- `admin/src/app/dashboard/test/page.tsx`
- `admin/src/app/dashboard/test/DeleteTestButton.tsx`
- `admin/src/app/dashboard/test/[documentId]/page.tsx` → `[id]/page.tsx`
- `admin/src/app/dashboard/test/[documentId]/EditTestForm.tsx` → `[id]/EditTestForm.tsx`
- `admin/src/app/dashboard/video/page.tsx`
- `admin/src/app/dashboard/video/DeleteVideoButton.tsx`
- `admin/src/app/dashboard/video/[documentId]/page.tsx` → `[id]/page.tsx`
- `admin/src/app/dashboard/video/[documentId]/EditVideoForm.tsx` → `[id]/EditVideoForm.tsx`
- `.env.example` — add ADMIN_BOT_SECRET, DATABASE_URL for admin; remove Strapi vars
- `docker-compose.yml` — add DATABASE_URL and ADMIN_BOT_SECRET to admin service

---

## Task 1: Prisma setup in admin

**Files:**
- Modify: `admin/package.json`
- Create: `admin/prisma/schema.prisma`
- Create: `admin/src/lib/db.ts`

- [ ] **Step 1: Install Prisma in admin**

```bash
cd /path/to/project/admin
npm install prisma @prisma/client
```

- [ ] **Step 2: Create admin/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Content ──────────────────────────────────────────────

model Theory {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  order     Int      @default(0)
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("theories")
}

model Exercise {
  id            Int      @id @default(autoincrement())
  type          String
  prompt        String
  answer        String
  correctOption String?
  optionA       String?
  optionB       String?
  optionC       String?
  optionD       String?
  explanation   String?
  imageUrl      String?
  published     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("exercises")
}

model Task {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  order     Int      @default(0)
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("tasks")
}

model TestQuestion {
  id            Int      @id @default(autoincrement())
  question      String
  optionA       String
  optionB       String
  optionC       String
  optionD       String
  correctOption String
  explanation   String?
  published     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("test_questions")
}

model Video {
  id          Int      @id @default(autoincrement())
  title       String
  url         String
  description String?
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("videos")
}

// ── User Progress ─────────────────────────────────────────

model TelegramUser {
  id              BigInt           @id
  username        String?
  firstName       String?
  lastName        String?
  isBlocked       Boolean          @default(false)
  lastActiveAt    DateTime         @default(now())
  createdAt       DateTime         @default(now())
  testResults     TestResult[]
  exerciseResults ExerciseResult[]

  @@map("telegram_users")
}

model TestResult {
  id        Int          @id @default(autoincrement())
  userId    BigInt
  score     Int
  total     Int
  createdAt DateTime     @default(now())
  user      TelegramUser @relation(fields: [userId], references: [id])

  @@map("test_results")
}

model ExerciseResult {
  id         Int          @id @default(autoincrement())
  userId     BigInt
  exerciseId Int
  isCorrect  Boolean
  createdAt  DateTime     @default(now())
  user       TelegramUser @relation(fields: [userId], references: [id])

  @@map("exercise_results")
}
```

- [ ] **Step 3: Add DATABASE_URL to local .env**

Add to `.env` (not committed):
```
DATABASE_URL=postgresql://qazaq:changeme@localhost:5432/qazaq?schema=admin
```

- [ ] **Step 4: Run Prisma migration**

```bash
cd admin
npx prisma migrate dev --name init
```

Expected output:
```
Applying migration `20260407_init`
Your database is now in sync with your schema.
✔ Generated Prisma Client
```

- [ ] **Step 5: Create admin/src/lib/db.ts**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 6: Verify Prisma client works**

```bash
cd admin
node -e "const { db } = require('./src/lib/db'); db.theory.count().then(console.log)"
```

Expected: `0`

- [ ] **Step 7: Update admin/src/types.ts**

Replace entire file:

```typescript
// Prisma-based types — id is number, published is boolean

export interface TheoryItem {
  id: number;
  title: string;
  content: string;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskItem {
  id: number;
  title: string;
  content: string;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseItem {
  id: number;
  type: "suffix" | "choice" | "fill_blank";
  prompt: string;
  answer: string;
  correctOption: "A" | "B" | "C" | "D" | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  explanation: string | null;
  imageUrl: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestQuestionItem {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoItem {
  id: number;
  title: string;
  url: string;
  description: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 8: Commit**

```bash
cd ..
git add admin/prisma admin/src/lib/db.ts admin/src/types.ts admin/package.json admin/package-lock.json
git commit -m "feat: add Prisma schema and client to admin"
```

---

## Task 2: Bot auth helper + bot content API routes

**Files:**
- Create: `admin/src/lib/botAuth.ts`
- Create: `admin/src/app/api/bot/theory/route.ts`
- Create: `admin/src/app/api/bot/exercises/route.ts`
- Create: `admin/src/app/api/bot/tasks/route.ts`
- Create: `admin/src/app/api/bot/test-questions/route.ts`
- Create: `admin/src/app/api/bot/videos/route.ts`

- [ ] **Step 1: Create admin/src/lib/botAuth.ts**

```typescript
export function isBotAuthorized(request: Request): boolean {
  const auth = request.headers.get("Authorization");
  const secret = process.env.ADMIN_BOT_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

- [ ] **Step 2: Create admin/src/app/api/bot/theory/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function GET(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  const items = await db.theory.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(items);
}
```

- [ ] **Step 3: Create admin/src/app/api/bot/exercises/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function GET(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  const items = await db.exercise.findMany({
    where: { published: true },
  });
  return NextResponse.json(items);
}
```

- [ ] **Step 4: Create admin/src/app/api/bot/tasks/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function GET(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  const items = await db.task.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(items);
}
```

- [ ] **Step 5: Create admin/src/app/api/bot/test-questions/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function GET(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  const items = await db.testQuestion.findMany({
    where: { published: true },
  });
  return NextResponse.json(items);
}
```

- [ ] **Step 6: Create admin/src/app/api/bot/videos/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function GET(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  const items = await db.video.findMany({
    where: { published: true },
  });
  return NextResponse.json(items);
}
```

- [ ] **Step 7: Add ADMIN_BOT_SECRET to local .env**

```
ADMIN_BOT_SECRET=test_secret_for_dev
```

- [ ] **Step 8: Test all bot content routes**

Start admin dev server: `cd admin && npm run dev`

Then in another terminal:

```bash
curl -H "Authorization: Bearer test_secret_for_dev" http://localhost:3000/api/bot/theory
# Expected: []

curl -H "Authorization: Bearer test_secret_for_dev" http://localhost:3000/api/bot/exercises
# Expected: []

curl -H "Authorization: Bearer wrong" http://localhost:3000/api/bot/theory
# Expected: {"error":"Unauthorized"}
```

- [ ] **Step 9: Commit**

```bash
git add admin/src/lib/botAuth.ts admin/src/app/api/bot/
git commit -m "feat: bot content API routes with auth"
```

---

## Task 3: Bot user progress API routes

**Files:**
- Create: `admin/src/app/api/bot/users/upsert/route.ts`
- Create: `admin/src/app/api/bot/results/test/route.ts`
- Create: `admin/src/app/api/bot/results/exercise/route.ts`

- [ ] **Step 1: Create admin/src/app/api/bot/users/upsert/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function POST(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  try {
    const { telegramId, username, firstName, lastName } =
      await request.json() as {
        telegramId: number;
        username?: string;
        firstName?: string;
        lastName?: string;
      };

    await db.telegramUser.upsert({
      where: { id: BigInt(telegramId) },
      create: {
        id: BigInt(telegramId),
        username,
        firstName,
        lastName,
        lastActiveAt: new Date(),
      },
      update: {
        username,
        firstName,
        lastName,
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create admin/src/app/api/bot/results/test/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function POST(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  try {
    const { telegramId, score, total } =
      await request.json() as { telegramId: number; score: number; total: number };

    await db.testResult.create({
      data: {
        userId: BigInt(telegramId),
        score,
        total,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create admin/src/app/api/bot/results/exercise/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function POST(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  try {
    const { telegramId, exerciseId, isCorrect } =
      await request.json() as { telegramId: number; exerciseId: number; isCorrect: boolean };

    await db.exerciseResult.create({
      data: {
        userId: BigInt(telegramId),
        exerciseId,
        isCorrect,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 4: Test progress routes**

```bash
# Upsert user
curl -X POST -H "Authorization: Bearer test_secret_for_dev" \
  -H "Content-Type: application/json" \
  -d '{"telegramId":123456,"firstName":"Test","username":"testuser"}' \
  http://localhost:3000/api/bot/users/upsert
# Expected: {"ok":true}

# Save test result
curl -X POST -H "Authorization: Bearer test_secret_for_dev" \
  -H "Content-Type: application/json" \
  -d '{"telegramId":123456,"score":7,"total":10}' \
  http://localhost:3000/api/bot/results/test
# Expected: {"ok":true}

# Save exercise result
curl -X POST -H "Authorization: Bearer test_secret_for_dev" \
  -H "Content-Type: application/json" \
  -d '{"telegramId":123456,"exerciseId":1,"isCorrect":true}' \
  http://localhost:3000/api/bot/results/exercise
# Expected: {"ok":true}
```

- [ ] **Step 5: Commit**

```bash
git add admin/src/app/api/bot/users admin/src/app/api/bot/results
git commit -m "feat: bot user progress API routes"
```

---

## Task 4: File upload API

**Files:**
- Modify: `admin/next.config.ts`
- Create: `admin/src/app/api/upload/route.ts`
- Create: `admin/src/app/api/files/[filename]/route.ts`

- [ ] **Step 1: Update admin/next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/api/files/[filename]": ["./uploads/**"],
  },
};

export default nextConfig;
```

- [ ] **Step 2: Create admin/src/app/api/upload/route.ts**

```typescript
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const UPLOADS_DIR = join(process.cwd(), "uploads");

export async function POST(request: Request) {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const filename = `${randomUUID()}.${ext}`;
    const bytes = await file.arrayBuffer();

    await writeFile(join(UPLOADS_DIR, filename), Buffer.from(bytes));

    return NextResponse.json({ url: `/api/files/${filename}` });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create admin/src/app/api/files/[filename]/route.ts**

```typescript
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

const UPLOADS_DIR = join(process.cwd(), "uploads");

export async function GET(
  _: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    // Prevent path traversal
    if (filename.includes("..") || filename.includes("/")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }
    const buffer = await readFile(join(UPLOADS_DIR, filename));
    const ext = filename.split(".").pop() ?? "bin";
    const contentType =
      ext === "png" ? "image/png" :
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
      ext === "gif" ? "image/gif" :
      ext === "webp" ? "image/webp" :
      "application/octet-stream";

    return new Response(buffer, {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
```

- [ ] **Step 4: Test file upload**

```bash
# Upload a test image
curl -X POST -F "file=@/path/to/test.png" http://localhost:3000/api/upload
# Expected: {"url":"/api/files/some-uuid.png"}

# Fetch the file
curl http://localhost:3000/api/files/some-uuid.png -o /tmp/test-out.png
# Expected: PNG file downloaded
```

- [ ] **Step 5: Commit**

```bash
git add admin/next.config.ts admin/src/app/api/upload admin/src/app/api/files
git commit -m "feat: file upload and serve API routes"
```

---

## Task 5: Refactor admin API routes — Ереже

**Files:**
- Modify: `admin/src/app/api/erezhe/route.ts`
- Delete: `admin/src/app/api/erezhe/[documentId]/route.ts`
- Create: `admin/src/app/api/erezhe/[id]/route.ts`

- [ ] **Step 1: Update admin/src/app/api/erezhe/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { title, content } = await request.json() as { title: string; content: string };
    const item = await db.theory.create({
      data: { title, content, published: true },
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Delete old [documentId] route**

```bash
rm -rf admin/src/app/api/erezhe/\[documentId\]
```

- [ ] **Step 3: Create admin/src/app/api/erezhe/[id]/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title, content, published } =
      await request.json() as { title: string; content: string; published: boolean };
    const item = await db.theory.update({
      where: { id: Number(id) },
      data: { title, content, published },
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.theory.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add admin/src/app/api/erezhe/
git commit -m "refactor: erezhe API routes use Prisma"
```

---

## Task 6: Refactor admin API routes — Тапсырма (tasks)

**Files:**
- Modify: `admin/src/app/api/tasks/route.ts`
- Delete: `admin/src/app/api/tasks/[documentId]/route.ts`
- Create: `admin/src/app/api/tasks/[id]/route.ts`

- [ ] **Step 1: Update admin/src/app/api/tasks/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { title, content } = await request.json() as { title: string; content: string };
    const maxOrder = await db.task.aggregate({ _max: { order: true } });
    const order = (maxOrder._max.order ?? -1) + 1;
    const item = await db.task.create({
      data: { title, content, order, published: true },
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Delete old route and create [id] route**

```bash
rm -rf admin/src/app/api/tasks/\[documentId\]
```

Create `admin/src/app/api/tasks/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title, content, published } =
      await request.json() as { title: string; content: string; published: boolean };
    const item = await db.task.update({
      where: { id: Number(id) },
      data: { title, content, published },
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.task.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/app/api/tasks/
git commit -m "refactor: tasks API routes use Prisma"
```

---

## Task 7: Refactor admin API routes — Жаттығу (exercises)

**Files:**
- Modify: `admin/src/app/api/exercises/route.ts`
- Delete: `admin/src/app/api/exercises/[documentId]/route.ts`
- Create: `admin/src/app/api/exercises/[id]/route.ts`

- [ ] **Step 1: Update admin/src/app/api/exercises/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      type: string;
      prompt: string;
      answer: string;
      correctOption?: string;
      optionA?: string;
      optionB?: string;
      optionC?: string;
      optionD?: string;
      explanation?: string;
      imageUrl?: string;
    };
    const item = await db.exercise.create({
      data: { ...body, published: true },
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Delete old route and create [id] route**

```bash
rm -rf admin/src/app/api/exercises/\[documentId\]
```

Create `admin/src/app/api/exercises/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      type: string;
      prompt: string;
      answer: string;
      correctOption?: string;
      optionA?: string;
      optionB?: string;
      optionC?: string;
      optionD?: string;
      explanation?: string;
      imageUrl?: string;
      published: boolean;
    };
    const item = await db.exercise.update({
      where: { id: Number(id) },
      data: body,
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.exercise.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/app/api/exercises/
git commit -m "refactor: exercises API routes use Prisma"
```

---

## Task 8: Refactor admin API routes — Тест + Видео

**Files:**
- Modify: `admin/src/app/api/test-questions/route.ts`
- Delete+Create: `admin/src/app/api/test-questions/[id]/route.ts`
- Modify: `admin/src/app/api/videos/route.ts`
- Delete+Create: `admin/src/app/api/videos/[id]/route.ts`

- [ ] **Step 1: Update admin/src/app/api/test-questions/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      question: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: string;
      explanation?: string;
    };
    const item = await db.testQuestion.create({
      data: { ...body, published: true },
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create admin/src/app/api/test-questions/[id]/route.ts**

```bash
rm -rf admin/src/app/api/test-questions/\[documentId\]
```

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      question: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: string;
      explanation?: string;
      published: boolean;
    };
    const item = await db.testQuestion.update({
      where: { id: Number(id) },
      data: body,
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.testQuestion.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Update admin/src/app/api/videos/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      title: string;
      url: string;
      description?: string;
    };
    const item = await db.video.create({
      data: { ...body, published: true },
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create admin/src/app/api/videos/[id]/route.ts**

```bash
rm -rf admin/src/app/api/videos/\[documentId\]
```

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      title: string;
      url: string;
      description?: string;
      published: boolean;
    };
    const item = await db.video.update({
      where: { id: Number(id) },
      data: body,
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.video.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add admin/src/app/api/test-questions/ admin/src/app/api/videos/
git commit -m "refactor: test-questions and videos API routes use Prisma"
```

---

## Task 9: Update admin UI — Ереже pages

The `[documentId]` route folders become `[id]`. Forms use `item.id` (number) instead of `item.documentId` (string). Status badge uses `item.published` instead of `item.publishedAt`.

**Files:**
- Modify: `admin/src/app/dashboard/erezhe/page.tsx`
- Modify: `admin/src/app/dashboard/erezhe/DeleteButton.tsx`
- Delete+Create: `admin/src/app/dashboard/erezhe/[id]/page.tsx`
- Delete+Create: `admin/src/app/dashboard/erezhe/[id]/EditErezheForm.tsx`

- [ ] **Step 1: Update erezhe/page.tsx**

```tsx
import Link from "next/link";
import { db } from "@/lib/db";
import DeleteButton from "./DeleteButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ErezhePage() {
  const items = await db.theory.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ереже</h1>
        <Button asChild>
          <Link href="/dashboard/erezhe/new">
            <Plus className="mr-2 h-4 w-4" /> Қосу
          </Link>
        </Button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-gray-500">Ереже жоқ.</p>}
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{item.title}</p>
                <Badge variant={item.published ? "default" : "secondary"}>
                  {item.published ? "Жарияланған" : "Черновик"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/erezhe/${item.id}`}>
                    <Pencil className="mr-1 h-3 w-3" /> Өңдеу
                  </Link>
                </Button>
                <DeleteButton id={item.id} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update erezhe/DeleteButton.tsx**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteButton({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/erezhe/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      <Trash2 className="mr-1 h-3 w-3" /> Жою
    </Button>
  );
}
```

- [ ] **Step 3: Delete old [documentId] folder and create [id] folder**

```bash
rm -rf admin/src/app/dashboard/erezhe/\[documentId\]
mkdir -p admin/src/app/dashboard/erezhe/\[id\]
```

- [ ] **Step 4: Create admin/src/app/dashboard/erezhe/[id]/page.tsx**

```tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditErezheForm from "./EditErezheForm";

export const dynamic = "force-dynamic";

export default async function EditErezhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await db.theory.findUnique({ where: { id: Number(id) } });
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Ережені өңдеу</h1>
      <EditErezheForm item={item} />
    </div>
  );
}
```

- [ ] **Step 5: Create admin/src/app/dashboard/erezhe/[id]/EditErezheForm.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { TheoryItem } from "@/types";

export default function EditErezheForm({ item }: { item: TheoryItem }) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [published, setPublished] = useState(item.published);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/erezhe/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, published }),
    });
    if (res.ok) { router.push("/dashboard/erezhe"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Тақырып</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>Мазмұн</Label>
        <RichEditor value={content} onChange={setContent} />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="pub" checked={published} onCheckedChange={(v) => setPublished(!!v)} />
        <Label htmlFor="pub">Жарияланған</Label>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Сақталуда..." : "Сақтау"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Болдырмау</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add admin/src/app/dashboard/erezhe/
git commit -m "refactor: erezhe UI pages use Prisma, [id] routes"
```

---

## Task 10: Update admin UI — Жаттығу pages

**Files:**
- Modify: `admin/src/app/dashboard/zhattyghu/page.tsx`
- Modify: `admin/src/app/dashboard/zhattyghu/DeleteTaskButton.tsx`
- Modify: `admin/src/app/dashboard/zhattyghu/DeleteExerciseButton.tsx`
- Delete+Create: `admin/src/app/dashboard/zhattyghu/document/[id]/page.tsx`
- Delete+Create: `admin/src/app/dashboard/zhattyghu/document/[id]/EditTaskForm.tsx`
- Delete+Create: `admin/src/app/dashboard/zhattyghu/interactive/[id]/page.tsx`
- Delete+Create: `admin/src/app/dashboard/zhattyghu/interactive/[id]/EditExerciseForm.tsx`

- [ ] **Step 1: Update zhattyghu/page.tsx**

```tsx
import Link from "next/link";
import { db } from "@/lib/db";
import DeleteTaskButton from "./DeleteTaskButton";
import DeleteExerciseButton from "./DeleteExerciseButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ZhattyghuPage() {
  const [tasks, exercises] = await Promise.all([
    db.task.findMany({ orderBy: { order: "asc" } }),
    db.exercise.findMany(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Жаттығу</h1>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Документ тапсырмалары ({tasks.length})</h2>
          <Button asChild size="sm">
            <Link href="/dashboard/zhattyghu/document/new"><Plus className="mr-1 h-4 w-4" /> Қосу</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {tasks.length === 0 && <p className="text-gray-500 text-sm">Тапсырма жоқ.</p>}
          {tasks.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant={item.published ? "default" : "secondary"}>
                    {item.published ? "Жарияланған" : "Черновик"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/zhattyghu/document/${item.id}`}>
                      <Pencil className="mr-1 h-3 w-3" /> Өңдеу
                    </Link>
                  </Button>
                  <DeleteTaskButton id={item.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Интерактивті жаттығулар ({exercises.length})</h2>
          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard/zhattyghu/interactive/new"><Plus className="mr-1 h-4 w-4" /> Қосу</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {exercises.length === 0 && <p className="text-gray-500 text-sm">Жаттығу жоқ.</p>}
          {exercises.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{item.prompt}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">{item.type}</Badge>
                    <Badge variant={item.published ? "default" : "secondary"}>
                      {item.published ? "Жарияланған" : "Черновик"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/zhattyghu/interactive/${item.id}`}>
                      <Pencil className="mr-1 h-3 w-3" /> Өңдеу
                    </Link>
                  </Button>
                  <DeleteExerciseButton id={item.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update DeleteTaskButton.tsx and DeleteExerciseButton.tsx**

`DeleteTaskButton.tsx`:
```tsx
"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteTaskButton({ id }: { id: number }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    router.refresh();
  }
  return <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="mr-1 h-3 w-3" /> Жою</Button>;
}
```

`DeleteExerciseButton.tsx`:
```tsx
"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteExerciseButton({ id }: { id: number }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    router.refresh();
  }
  return <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="mr-1 h-3 w-3" /> Жою</Button>;
}
```

- [ ] **Step 3: Delete old [documentId] folders and create [id] folders**

```bash
rm -rf admin/src/app/dashboard/zhattyghu/document/\[documentId\]
rm -rf admin/src/app/dashboard/zhattyghu/interactive/\[documentId\]
mkdir -p admin/src/app/dashboard/zhattyghu/document/\[id\]
mkdir -p admin/src/app/dashboard/zhattyghu/interactive/\[id\]
```

- [ ] **Step 4: Create document/[id]/page.tsx**

```tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditTaskForm from "./EditTaskForm";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await db.task.findUnique({ where: { id: Number(id) } });
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Тапсырманы өңдеу</h1>
      <EditTaskForm item={item} />
    </div>
  );
}
```

- [ ] **Step 5: Create document/[id]/EditTaskForm.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { TaskItem } from "@/types";

export default function EditTaskForm({ item }: { item: TaskItem }) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [published, setPublished] = useState(item.published);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/tasks/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, published }),
    });
    if (res.ok) { router.push("/dashboard/zhattyghu"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1"><Label>Тақырып</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
      <div className="space-y-1"><Label>Мазмұн</Label><RichEditor value={content} onChange={setContent} /></div>
      <div className="flex items-center gap-2">
        <Checkbox id="pub" checked={published} onCheckedChange={(v) => setPublished(!!v)} />
        <Label htmlFor="pub">Жарияланған</Label>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Сақталуда..." : "Сақтау"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Болдырмау</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 6: Create interactive/[id]/page.tsx**

```tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditExerciseForm from "./EditExerciseForm";

export const dynamic = "force-dynamic";

export default async function EditExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await db.exercise.findUnique({ where: { id: Number(id) } });
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаттығуды өңдеу</h1>
      <EditExerciseForm item={item} />
    </div>
  );
}
```

- [ ] **Step 7: Create interactive/[id]/EditExerciseForm.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ExerciseItem } from "@/types";

export default function EditExerciseForm({ item }: { item: ExerciseItem }) {
  const router = useRouter();
  const [form, setForm] = useState({
    type: item.type, prompt: item.prompt, answer: item.answer,
    correctOption: item.correctOption ?? "A",
    optionA: item.optionA ?? "", optionB: item.optionB ?? "",
    optionC: item.optionC ?? "", optionD: item.optionD ?? "",
    explanation: item.explanation ?? "",
    imageUrl: item.imageUrl ?? "",
    published: item.published,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  function set(key: string, value: string | boolean) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json() as { url: string };
      set("imageUrl", url);
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = form.type === "choice"
      ? { ...form, answer: form.correctOption }
      : { type: form.type, prompt: form.prompt, answer: form.answer, explanation: form.explanation, imageUrl: form.imageUrl, published: form.published };
    const res = await fetch(`/api/exercises/${item.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { router.push("/dashboard/zhattyghu"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Тип</Label>
        <Select value={form.type} onValueChange={(v) => set("type", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="choice">Таңдау (choice)</SelectItem>
            <SelectItem value="suffix">Жалғау (suffix)</SelectItem>
            <SelectItem value="fill_blank">Бос толтыру (fill_blank)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1"><Label>Сұрақ</Label><Textarea value={form.prompt} onChange={(e) => set("prompt", e.target.value)} className="h-24" required /></div>
      {form.type === "choice" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {(["A", "B", "C", "D"] as const).map((opt) => (
              <div key={opt} className="space-y-1">
                <Label>Вариант {opt}</Label>
                <Input value={form[`option${opt}` as keyof typeof form] as string} onChange={(e) => set(`option${opt}`, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <Label>Дұрыс жауап</Label>
            <Select value={form.correctOption} onValueChange={(v) => set("correctOption", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["A","B","C","D"] as const).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </>
      ) : (
        <div className="space-y-1"><Label>Дұрыс жауап</Label><Input value={form.answer} onChange={(e) => set("answer", e.target.value)} required /></div>
      )}
      <div className="space-y-1"><Label>Түсіндірме</Label><Textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)} className="h-20" /></div>
      <div className="space-y-1">
        <Label>Сурет</Label>
        <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
        {uploading && <p className="text-sm text-gray-500">Жүктелуде...</p>}
        {form.imageUrl && <img src={form.imageUrl} alt="preview" className="mt-2 max-h-40 rounded" />}
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="pub" checked={form.published} onCheckedChange={(v) => set("published", !!v)} />
        <Label htmlFor="pub">Жарияланған</Label>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Сақталуда..." : "Сақтау"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Болдырмау</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add admin/src/app/dashboard/zhattyghu/
git commit -m "refactor: zhattyghu UI pages use Prisma, [id] routes"
```

---

## Task 11: Update admin UI — Тест + Видео pages

**Files:**
- Modify: `admin/src/app/dashboard/test/page.tsx`
- Modify: `admin/src/app/dashboard/test/DeleteTestButton.tsx`
- Delete+Create: `admin/src/app/dashboard/test/[id]/page.tsx`
- Delete+Create: `admin/src/app/dashboard/test/[id]/EditTestForm.tsx`
- Modify: `admin/src/app/dashboard/video/page.tsx`
- Modify: `admin/src/app/dashboard/video/DeleteVideoButton.tsx`
- Delete+Create: `admin/src/app/dashboard/video/[id]/page.tsx`
- Delete+Create: `admin/src/app/dashboard/video/[id]/EditVideoForm.tsx`

- [ ] **Step 1: Update test/page.tsx**

```tsx
import Link from "next/link";
import { db } from "@/lib/db";
import DeleteTestButton from "./DeleteTestButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TestPage() {
  const items = await db.testQuestion.findMany();
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Тест</h1>
        <Button asChild><Link href="/dashboard/test/new"><Plus className="mr-2 h-4 w-4" /> Қосу</Link></Button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-gray-500">Тест жоқ.</p>}
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium text-sm">{item.question}</p>
                <Badge variant={item.published ? "default" : "secondary"}>
                  {item.published ? "Жарияланған" : "Черновик"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/test/${item.id}`}><Pencil className="mr-1 h-3 w-3" /> Өңдеу</Link>
                </Button>
                <DeleteTestButton id={item.id} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update test/DeleteTestButton.tsx**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteTestButton({ id }: { id: number }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/test-questions/${id}`, { method: "DELETE" });
    router.refresh();
  }
  return <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="mr-1 h-3 w-3" /> Жою</Button>;
}
```

- [ ] **Step 3: Create test/[id]/page.tsx and EditTestForm.tsx**

```bash
rm -rf admin/src/app/dashboard/test/\[documentId\]
mkdir -p admin/src/app/dashboard/test/\[id\]
```

`test/[id]/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditTestForm from "./EditTestForm";

export const dynamic = "force-dynamic";

export default async function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await db.testQuestion.findUnique({ where: { id: Number(id) } });
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Тест сұрақты өңдеу</h1>
      <EditTestForm item={item} />
    </div>
  );
}
```

`test/[id]/EditTestForm.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TestQuestionItem } from "@/types";

export default function EditTestForm({ item }: { item: TestQuestionItem }) {
  const router = useRouter();
  const [form, setForm] = useState({
    question: item.question, optionA: item.optionA, optionB: item.optionB,
    optionC: item.optionC, optionD: item.optionD, correctOption: item.correctOption,
    explanation: item.explanation ?? "", published: item.published,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string | boolean) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/test-questions/${item.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { router.push("/dashboard/test"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1"><Label>Сұрақ</Label><Textarea value={form.question} onChange={(e) => set("question", e.target.value)} className="h-24" required /></div>
      <div className="grid grid-cols-2 gap-3">
        {(["A","B","C","D"] as const).map((opt) => (
          <div key={opt} className="space-y-1">
            <Label>Вариант {opt}</Label>
            <Input value={form[`option${opt}` as keyof typeof form] as string} onChange={(e) => set(`option${opt}`, e.target.value)} required />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Label>Дұрыс жауап</Label>
        <Select value={form.correctOption} onValueChange={(v) => set("correctOption", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{(["A","B","C","D"] as const).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1"><Label>Түсіндірме</Label><Textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)} className="h-20" /></div>
      <div className="flex items-center gap-2">
        <Checkbox id="pub" checked={form.published} onCheckedChange={(v) => set("published", !!v)} />
        <Label htmlFor="pub">Жарияланған</Label>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Сақталуда..." : "Сақтау"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Болдырмау</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Update video/page.tsx**

```tsx
import Link from "next/link";
import { db } from "@/lib/db";
import DeleteVideoButton from "./DeleteVideoButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VideoPage() {
  const items = await db.video.findMany();
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Видео</h1>
        <Button asChild><Link href="/dashboard/video/new"><Plus className="mr-2 h-4 w-4" /> Қосу</Link></Button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-gray-500">Видео жоқ.</p>}
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-gray-500 truncate max-w-xs">{item.url}</p>
                <Badge variant={item.published ? "default" : "secondary"}>
                  {item.published ? "Жарияланған" : "Черновик"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/video/${item.id}`}><Pencil className="mr-1 h-3 w-3" /> Өңдеу</Link>
                </Button>
                <DeleteVideoButton id={item.id} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update video/DeleteVideoButton.tsx**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteVideoButton({ id }: { id: number }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/videos/${id}`, { method: "DELETE" });
    router.refresh();
  }
  return <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="mr-1 h-3 w-3" /> Жою</Button>;
}
```

- [ ] **Step 6: Create video/[id]/page.tsx and EditVideoForm.tsx**

```bash
rm -rf admin/src/app/dashboard/video/\[documentId\]
mkdir -p admin/src/app/dashboard/video/\[id\]
```

`video/[id]/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditVideoForm from "./EditVideoForm";

export const dynamic = "force-dynamic";

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await db.video.findUnique({ where: { id: Number(id) } });
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Видеоны өңдеу</h1>
      <EditVideoForm item={item} />
    </div>
  );
}
```

`video/[id]/EditVideoForm.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { VideoItem } from "@/types";

export default function EditVideoForm({ item }: { item: VideoItem }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: item.title, url: item.url, description: item.description ?? "", published: item.published,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string | boolean) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/videos/${item.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { router.push("/dashboard/video"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1"><Label>Тақырып</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} required /></div>
      <div className="space-y-1"><Label>URL</Label><Input value={form.url} onChange={(e) => set("url", e.target.value)} type="url" required /></div>
      <div className="space-y-1"><Label>Сипаттама</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="h-24" /></div>
      <div className="flex items-center gap-2">
        <Checkbox id="pub" checked={form.published} onCheckedChange={(v) => set("published", !!v)} />
        <Label htmlFor="pub">Жарияланған</Label>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Сақталуда..." : "Сақтау"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Болдырмау</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add admin/src/app/dashboard/test/ admin/src/app/dashboard/video/
git commit -m "refactor: test and video UI pages use Prisma, [id] routes"
```

---

## Task 12: Remove lib/strapi.ts, update env + Docker

**Files:**
- Delete: `admin/src/lib/strapi.ts`
- Modify: `docker-compose.yml`
- Modify: `.env.example`

- [ ] **Step 1: Delete admin/src/lib/strapi.ts**

```bash
rm admin/src/lib/strapi.ts
```

- [ ] **Step 2: Verify no remaining imports of lib/strapi**

```bash
grep -r "from.*lib/strapi" admin/src/
```

Expected: no output (zero matches)

- [ ] **Step 3: Update docker-compose.yml admin service**

Replace the existing `admin` service block with:

```yaml
  admin:
    build: ./admin
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/qazaq?schema=admin
      ADMIN_USERNAME: ${ADMIN_USERNAME}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      ADMIN_SESSION_SECRET: ${ADMIN_SESSION_SECRET}
      ADMIN_BOT_SECRET: ${ADMIN_BOT_SECRET}
    ports:
      - "3000:3000"
    volumes:
      - admin_uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
```

Add `admin_uploads:` to the `volumes:` section at the bottom of docker-compose.yml.

- [ ] **Step 4: Update .env.example**

Add:
```
# Admin panel
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme
ADMIN_SESSION_SECRET=generate_with_openssl_rand_hex_32
ADMIN_BOT_SECRET=generate_with_openssl_rand_hex_32
```

Remove (no longer needed after full Strapi removal — leave for now, Plan 2 removes them):
```
# These will be removed in Plan 2 after data migration
# STRAPI_APP_KEYS=...
# STRAPI_API_TOKEN_SALT=...
# STRAPI_ADMIN_JWT_SECRET=...
# STRAPI_JWT_SECRET=...
# STRAPI_TRANSFER_TOKEN_SALT=...
# STRAPI_API_TOKEN=...
```

- [ ] **Step 5: Build and verify**

```bash
cd admin && npm run build 2>&1 | tail -20
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 6: End-to-end smoke test**

Start the admin locally:
```bash
cd admin && npm run dev
```

Test the full flow:
1. Open http://localhost:3000 → redirects to /login
2. Login with credentials → enters /dashboard
3. Create a new ереже → appears in list
4. Edit it → changes saved
5. Delete it → removed from list
6. Create a new видео → appears in list
7. Check bot API: `curl -H "Authorization: Bearer test_secret_for_dev" http://localhost:3000/api/bot/theory` → returns `[]`

- [ ] **Step 7: Final commit**

```bash
cd ..
git add admin/ docker-compose.yml .env.example
git commit -m "feat: admin fully migrated to Prisma, Strapi removed from admin"
```

---

## Self-Review

**Spec coverage:**
- ✅ Prisma schema with all content + user models — Task 1
- ✅ Bot content API routes (theory, exercises, tasks, test-questions, videos) — Task 2
- ✅ Bot user progress API routes (upsert, test result, exercise result) — Task 3
- ✅ File upload + serve — Task 4
- ✅ Admin API routes use Prisma (erezhe, tasks, exercises, test-questions, videos) — Tasks 5-8
- ✅ Admin UI list pages use Prisma directly — Tasks 9-11
- ✅ [documentId] → [id] everywhere — Tasks 9-11
- ✅ Docker + env updated — Task 12
- ✅ lib/strapi.ts removed — Task 12

**Placeholder scan:** No TBDs found.

**Type consistency:** `TheoryItem`, `TaskItem`, `ExerciseItem`, `TestQuestionItem`, `VideoItem` defined in Task 1 (`types.ts`) — all use `id: number` and `published: boolean`. All forms and pages use `item.id` (number). Delete buttons receive `id: number`. API routes parse `Number(id)`. Consistent throughout.

---

> **Next:** Plan 2 covers bot migration (replace strapi.ts with adminApi.ts, remove Prisma from bot), data migration script, and final Docker cleanup (remove Strapi service).
