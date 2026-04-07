# Strapi Removal — Plan 2: Bot Migration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Strapi and Prisma from the bot entirely — replace with a single `adminApi.ts` service that calls the Admin app's `/api/bot/*` HTTP endpoints.

**Architecture:** `adminApi.ts` is a drop-in replacement for `strapi.ts` that makes authenticated HTTP calls to the Admin app instead of Strapi. `progress.ts` delegates to `adminApi` instead of Prisma. All handlers are updated to use the new service. Strapi/Prisma code and deps are then deleted.

**Tech Stack:** Node 24 (native `fetch`), `nock` for HTTP mocking in tests, no Prisma

---

## File Map

### New files
- `bot/src/services/adminApi.ts` — HTTP client for Admin app `/api/bot/*` endpoints (replaces `strapi.ts`)
- `bot/src/services/__tests__/adminApi.test.ts` — nock-based tests for `adminApi`

### Modified files
- `bot/src/services/progress.ts` — delegate to `adminApiService` instead of Prisma
- `bot/src/services/__tests__/progress.test.ts` — mock `adminApiService` instead of Prisma
- `bot/src/config.ts` — remove `DATABASE_URL`, `STRAPI_URL`, `STRAPI_API_TOKEN`, `STRAPI_PUBLIC_URL`; add `ADMIN_URL`, `ADMIN_BOT_SECRET`
- `bot/src/handlers/start.ts` — call `adminApiService.upsertUser()` once (not two calls)
- `bot/src/handlers/exercises.ts` — use `adminApiService`, fix `imageUrl` field, remove `updateExerciseStats`
- `bot/src/handlers/tests.ts` — use `adminApiService`, remove `updateTestStats`
- `bot/src/handlers/theory.ts` — use `adminApiService`
- `bot/src/handlers/video.ts` — use `adminApiService`
- `bot/package.json` — remove `prisma`, `@prisma/client`; remove prisma scripts
- `bot/Dockerfile` — remove Prisma-related steps
- `.env.example` — replace Strapi vars with `ADMIN_URL`, `ADMIN_BOT_SECRET`
- `docker-compose.yml` — update `bot` and `admin` services, remove `strapi` service

### Deleted files
- `bot/src/services/strapi.ts`
- `bot/src/services/__tests__/strapi.test.ts`
- `bot/src/db/prisma.ts`
- `bot/src/db/__tests__/prisma.test.ts`
- `bot/prisma/` (entire folder)

---

## Task 1: Create `adminApi.ts` with tests

**Files:**
- Create: `bot/src/services/__tests__/adminApi.test.ts`
- Create: `bot/src/services/adminApi.ts`

- [ ] **Step 1: Write failing tests**

Create `bot/src/services/__tests__/adminApi.test.ts`:

```typescript
import nock from "nock";
import { adminApiService } from "../adminApi";

const BASE = "http://localhost:3000";
const SECRET = "test-secret";

beforeEach(() => {
  process.env.ADMIN_URL = BASE;
  process.env.ADMIN_BOT_SECRET = SECRET;
});

afterEach(() => nock.cleanAll());

describe("adminApiService.getTheory", () => {
  it("returns theory items sorted by order", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .get("/api/bot/theory")
      .reply(200, [
        { id: 1, title: "Буын үндестігі", content: "Мазмұн...", order: 1, published: true },
        { id: 2, title: "Ілгерінді үндестік", content: "Мазмұн 2...", order: 2, published: true },
      ]);

    const items = await adminApiService.getTheory();
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("Буын үндестігі");
    expect(items[0].id).toBe(1);
  });

  it("throws on 401", async () => {
    nock(BASE).get("/api/bot/theory").reply(401, { error: "Unauthorized" });
    await expect(adminApiService.getTheory()).rejects.toThrow("Admin API error 401");
  });
});

describe("adminApiService.getVideos", () => {
  it("returns video list", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .get("/api/bot/videos")
      .reply(200, [
        { id: 1, title: "Видео 1", url: "https://youtube.com/watch?v=xxx", description: "Сипаттама", published: true },
      ]);

    const videos = await adminApiService.getVideos();
    expect(videos).toHaveLength(1);
    expect(videos[0].url).toBe("https://youtube.com/watch?v=xxx");
  });
});

describe("adminApiService.getTestQuestions", () => {
  it("returns test questions", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .get("/api/bot/test-questions")
      .reply(200, [
        {
          id: 1,
          question: "Сұрақ?",
          optionA: "А жауап",
          optionB: "Б жауап",
          optionC: "В жауап",
          optionD: "Г жауап",
          correctOption: "A",
          explanation: "Себебі...",
          published: true,
        },
      ]);

    const questions = await adminApiService.getTestQuestions();
    expect(questions).toHaveLength(1);
    expect(questions[0].correctOption).toBe("A");
  });
});

describe("adminApiService.getExercises", () => {
  it("returns exercises with imageUrl", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .get("/api/bot/exercises")
      .reply(200, [
        {
          id: 1,
          type: "fill_blank",
          prompt: "Толтырыңыз: кіт___",
          answer: "кітап",
          explanation: "Дұрыс жауап — кітап",
          imageUrl: null,
          published: true,
        },
      ]);

    const exercises = await adminApiService.getExercises();
    expect(exercises).toHaveLength(1);
    expect(exercises[0].type).toBe("fill_blank");
    expect(exercises[0].imageUrl).toBeNull();
  });
});

describe("adminApiService.getTasks", () => {
  it("returns tasks", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .get("/api/bot/tasks")
      .reply(200, [
        { id: 1, title: "Тапсырма 1", content: "Мазмұн", order: 1, published: true },
      ]);

    const tasks = await adminApiService.getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Тапсырма 1");
  });
});

describe("adminApiService.upsertUser", () => {
  it("posts user data and resolves", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .post("/api/bot/users/upsert", { telegramId: 123, username: "alice", firstName: "Alice", lastName: undefined })
      .reply(200, { ok: true });

    await expect(
      adminApiService.upsertUser(123, "alice", "Alice", undefined)
    ).resolves.toBeUndefined();
  });
});

describe("adminApiService.saveTestResult", () => {
  it("posts test result and resolves", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .post("/api/bot/results/test", { telegramId: 123, score: 7, total: 10 })
      .reply(200, { ok: true });

    await expect(adminApiService.saveTestResult(123, 7, 10)).resolves.toBeUndefined();
  });
});

describe("adminApiService.saveExerciseResult", () => {
  it("posts exercise result and resolves", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .post("/api/bot/results/exercise", { telegramId: 123, exerciseId: 5, isCorrect: true })
      .reply(200, { ok: true });

    await expect(adminApiService.saveExerciseResult(123, 5, true)).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /path/to/project/bot
npm test -- --testPathPattern=adminApi
```

Expected: FAIL — `Cannot find module '../adminApi'`

- [ ] **Step 3: Create `bot/src/services/adminApi.ts`**

```typescript
import { config } from "../config";

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
  description: string | null;
}

export interface TestQuestion {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string | null;
}

export interface Exercise {
  id: number;
  type: "suffix" | "choice" | "fill_blank";
  prompt: string;
  answer: string;
  correctOption?: "A" | "B" | "C" | "D";
  explanation: string | null;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  imageUrl: string | null;
}

export interface Task {
  id: number;
  title: string;
  content: string;
  order: number;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${config.ADMIN_BOT_SECRET}`,
    "Content-Type": "application/json",
  };
}

async function apiGet<T>(path: string): Promise<T[]> {
  const url = `${config.ADMIN_URL}${path}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Admin API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T[]>;
}

async function apiPost(path: string, body: Record<string, unknown>): Promise<void> {
  const url = `${config.ADMIN_URL}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Admin API error ${res.status}: ${await res.text()}`);
}

export const adminApiService = {
  getTheory(): Promise<TheoryItem[]> {
    return apiGet<TheoryItem>("/api/bot/theory");
  },

  getVideos(): Promise<VideoItem[]> {
    return apiGet<VideoItem>("/api/bot/videos");
  },

  getTestQuestions(): Promise<TestQuestion[]> {
    return apiGet<TestQuestion>("/api/bot/test-questions");
  },

  getExercises(): Promise<Exercise[]> {
    return apiGet<Exercise>("/api/bot/exercises");
  },

  getTasks(): Promise<Task[]> {
    return apiGet<Task>("/api/bot/tasks");
  },

  async upsertUser(telegramId: number, username?: string, firstName?: string, lastName?: string): Promise<void> {
    return apiPost("/api/bot/users/upsert", { telegramId, username, firstName, lastName });
  },

  async saveTestResult(telegramId: number, score: number, total: number): Promise<void> {
    return apiPost("/api/bot/results/test", { telegramId, score, total });
  },

  async saveExerciseResult(telegramId: number, exerciseId: number, isCorrect: boolean): Promise<void> {
    return apiPost("/api/bot/results/exercise", { telegramId, exerciseId, isCorrect });
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /path/to/project/bot
npm test -- --testPathPattern=adminApi
```

Expected: PASS — 8 tests pass

- [ ] **Step 5: Commit**

```bash
git add bot/src/services/adminApi.ts bot/src/services/__tests__/adminApi.test.ts
git commit -m "feat: add adminApi service to replace strapi calls"
```

---

## Task 2: Update `progress.ts` to use `adminApi`

**Files:**
- Modify: `bot/src/services/progress.ts`
- Modify: `bot/src/services/__tests__/progress.test.ts`

- [ ] **Step 1: Write updated test**

Replace the entire contents of `bot/src/services/__tests__/progress.test.ts`:

```typescript
import { progressService } from "../progress";
import { adminApiService } from "../adminApi";

jest.mock("../adminApi", () => ({
  adminApiService: {
    upsertUser: jest.fn(),
    saveTestResult: jest.fn(),
    saveExerciseResult: jest.fn(),
  },
}));

const mockedApi = adminApiService as jest.Mocked<typeof adminApiService>;

beforeEach(() => jest.clearAllMocks());

describe("progressService.upsertUser", () => {
  it("delegates to adminApiService.upsertUser", async () => {
    mockedApi.upsertUser.mockResolvedValue(undefined);
    await progressService.upsertUser(123, "alice", "Alice", "Smith");
    expect(mockedApi.upsertUser).toHaveBeenCalledWith(123, "alice", "Alice", "Smith");
  });
});

describe("progressService.saveTestResult", () => {
  it("delegates to adminApiService.saveTestResult", async () => {
    mockedApi.saveTestResult.mockResolvedValue(undefined);
    await progressService.saveTestResult(123, 7, 10);
    expect(mockedApi.saveTestResult).toHaveBeenCalledWith(123, 7, 10);
  });
});

describe("progressService.saveExerciseResult", () => {
  it("delegates to adminApiService.saveExerciseResult", async () => {
    mockedApi.saveExerciseResult.mockResolvedValue(undefined);
    await progressService.saveExerciseResult(123, 5, true);
    expect(mockedApi.saveExerciseResult).toHaveBeenCalledWith(123, 5, true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /path/to/project/bot
npm test -- --testPathPattern=progress
```

Expected: FAIL — current progress.ts uses Prisma, not adminApiService

- [ ] **Step 3: Replace `bot/src/services/progress.ts`**

```typescript
import { adminApiService } from "./adminApi";

export const progressService = {
  async upsertUser(telegramId: number, username?: string, firstName?: string, lastName?: string): Promise<void> {
    await adminApiService.upsertUser(telegramId, username, firstName, lastName);
  },

  async saveTestResult(telegramId: number, score: number, total: number): Promise<void> {
    await adminApiService.saveTestResult(telegramId, score, total);
  },

  async saveExerciseResult(telegramId: number, exerciseId: number, isCorrect: boolean): Promise<void> {
    await adminApiService.saveExerciseResult(telegramId, exerciseId, isCorrect);
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /path/to/project/bot
npm test -- --testPathPattern=progress
```

Expected: PASS — 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add bot/src/services/progress.ts bot/src/services/__tests__/progress.test.ts
git commit -m "refactor: progress.ts delegates to adminApiService"
```

---

## Task 3: Update `config.ts`

**Files:**
- Modify: `bot/src/config.ts`

- [ ] **Step 1: Replace `bot/src/config.ts`**

```typescript
import "dotenv/config";

function require_env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

export const config = {
  get BOT_TOKEN(): string {
    return require_env("BOT_TOKEN");
  },
  get ALEM_API_KEY(): string {
    return require_env("ALEM_API_KEY");
  },
  get ADMIN_URL(): string {
    return require_env("ADMIN_URL");
  },
  get ADMIN_BOT_SECRET(): string {
    return require_env("ADMIN_BOT_SECRET");
  },
};
```

- [ ] **Step 2: Run all tests to verify nothing broke**

```bash
cd /path/to/project/bot
npm test
```

Expected: PASS — adminApi and progress tests pass; strapi and prisma tests will still pass (they set their own env vars)

- [ ] **Step 3: Commit**

```bash
git add bot/src/config.ts
git commit -m "refactor: remove Strapi/DB env vars from bot config, add ADMIN_URL + ADMIN_BOT_SECRET"
```

---

## Task 4: Update handlers

**Files:**
- Modify: `bot/src/handlers/start.ts`
- Modify: `bot/src/handlers/exercises.ts`
- Modify: `bot/src/handlers/tests.ts`
- Modify: `bot/src/handlers/theory.ts`
- Modify: `bot/src/handlers/video.ts`

- [ ] **Step 1: Replace `bot/src/handlers/start.ts`**

```typescript
import { type MyContext } from "../index";
import { mainMenuKeyboard } from "../keyboards/menus";
import { adminApiService } from "../services/adminApi";

export async function handleStart(ctx: MyContext): Promise<void> {
  const telegramId = ctx.from!.id;
  const username = ctx.from?.username;
  const firstName = ctx.from?.first_name;
  const lastName = ctx.from?.last_name;

  adminApiService
    .upsertUser(telegramId, username, firstName, lastName)
    .catch((err) => console.error("Failed to upsert user:", err.message));

  await ctx.reply(
    "Сәлем! Мен ықпал заңын үйретемін 📚\n\nТөмендегі мәзірден бөлімді таңдаңыз:",
    { reply_markup: mainMenuKeyboard }
  );
}
```

- [ ] **Step 2: Replace `bot/src/handlers/theory.ts`**

```typescript
import { InlineKeyboard } from "grammy";

import { backToMenuInline } from "../keyboards/menus";
import { type MyConversation, type MyContext } from "../index";
import { adminApiService } from "../services/adminApi";

export async function theoryConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const items = await conversation.external(() => adminApiService.getTheory());

  if (items.length === 0) {
    await ctx.reply("Ереже материалдары әлі жоқ.");
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

  await ctx.reply("Ережені таңдаңыз:", { reply_markup: kb });

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

- [ ] **Step 3: Replace `bot/src/handlers/video.ts`**

```typescript
import { backToMenuInline } from "../keyboards/menus";
import { type MyConversation, type MyContext } from "../index";
import { adminApiService } from "../services/adminApi";

export async function videoConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const videos = await conversation.external(() => adminApiService.getVideos());

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

- [ ] **Step 4: Replace `bot/src/handlers/tests.ts`**

```typescript
import { InlineKeyboard } from "grammy";

import { backToMenuInline } from "../keyboards/menus";
import { type MyConversation, type MyContext } from "../index";
import { adminApiService, type TestQuestion } from "../services/adminApi";

export async function testsConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const questions = await conversation.external(() => adminApiService.getTestQuestions());

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

    await ctx.reply(`*Сұрақ ${i + 1}/${questions.length}*\n\n${q.question}`, {
      parse_mode: "Markdown",
      reply_markup: kb,
    });

    const cb = await conversation.waitForCallbackQuery(["A", "B", "C", "D"]);
    await cb.answerCallbackQuery();
    const userAnswer = cb.callbackQuery.data as "A" | "B" | "C" | "D";

    const isCorrect = userAnswer === q.correctOption;
    if (isCorrect) score++;
    results.push({ question: q, userAnswer, isCorrect });
  }

  const percent = Math.round((score / questions.length) * 100);
  await ctx.reply(`📊 *Нәтиже: ${score} / ${questions.length} (${percent}%)*`, {
    parse_mode: "Markdown",
  });

  for (const r of results) {
    const status = r.isCorrect ? "✅" : "❌";
    const text =
      `${status} ${r.question.question}\n` +
      `Сіздің жауабыңыз: *${r.userAnswer}* | Дұрыс: *${r.question.correctOption}*` +
      (r.question.explanation ? `\n\n${r.question.explanation}` : "");
    await ctx.reply(text, { parse_mode: "Markdown" });
  }

  const telegramId = ctx.from!.id;
  await conversation.external(() =>
    adminApiService.saveTestResult(telegramId, score, questions.length)
  );

  await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
  await conversation.waitForCallbackQuery("menu");
}
```

- [ ] **Step 5: Replace `bot/src/handlers/exercises.ts`**

```typescript
import { InlineKeyboard, InputFile } from "grammy";

import { backToMenuInline } from "../keyboards/menus";
import { type MyConversation, type MyContext } from "../index";
import { adminApiService, type Exercise, type Task } from "../services/adminApi";
import { config } from "../config";

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

async function showExercise(ctx: MyContext, exercise: Exercise): Promise<void> {
  const text = `✏️ Жаттығу\n\n${exercise.prompt}`;
  if (exercise.imageUrl) {
    const imageUrl = exercise.imageUrl.startsWith("http")
      ? exercise.imageUrl
      : `${config.ADMIN_URL}${exercise.imageUrl}`;
    const imageBuffer = await fetchImageBuffer(imageUrl);
    if (imageBuffer) {
      await ctx.replyWithPhoto(new InputFile(imageBuffer, "exercise.png"), { caption: text });
    } else {
      await ctx.reply(text);
    }
  } else {
    await ctx.reply(text);
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
  const [tasks, exercises] = await conversation.external(() =>
    Promise.all([adminApiService.getTasks(), adminApiService.getExercises()])
  );

  if (tasks.length === 0 && exercises.length === 0) {
    await ctx.reply("Жаттығулар әлі жоқ.");
    await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
    await conversation.waitForCallbackQuery("menu");
    return;
  }

  // Show document tasks first
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    await ctx.reply(`📄 *${task.title}*\n\n${task.content}`, { parse_mode: "Markdown" });

    if (i < tasks.length - 1 || exercises.length > 0) {
      const navKb = new InlineKeyboard()
        .text("➡️ Келесі", "next")
        .text("⬅️ Мәзір", "menu");
      await ctx.reply("Жалғастырасыз ба?", { reply_markup: navKb });
      const nav = await conversation.waitForCallbackQuery(["next", "menu"]);
      await nav.answerCallbackQuery();
      if (nav.callbackQuery.data === "menu") return;
    }
  }

  // Then interactive exercises
  const telegramId = ctx.from!.id;

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];

    await showExercise(ctx, exercise);
    const userAnswer = await getAnswer(conversation, ctx, exercise);

    const correctAnswer =
      exercise.type === "choice"
        ? (exercise.correctOption ?? exercise.answer).toUpperCase()
        : exercise.answer.trim().toLowerCase();

    const normalizedUser = exercise.type === "choice" ? userAnswer.toUpperCase() : userAnswer;
    const isCorrect = normalizedUser === correctAnswer;

    await conversation.external(() =>
      adminApiService.saveExerciseResult(telegramId, exercise.id, isCorrect)
    );

    if (isCorrect) {
      await ctx.reply(`✅ Дұрыс!\n\n${exercise.explanation ?? ""}`);
    } else {
      const displayAnswer =
        exercise.type === "choice"
          ? (exercise.correctOption ?? exercise.answer).toUpperCase()
          : exercise.answer;
      await ctx.reply(
        `❌ Қате. Дұрыс жауап: *${displayAnswer}*\n\n${exercise.explanation ?? ""}`,
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

- [ ] **Step 6: Run TypeScript compiler to verify no type errors**

```bash
cd /path/to/project/bot
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add bot/src/handlers/
git commit -m "refactor: handlers use adminApiService instead of strapi + prisma"
```

---

## Task 5: Remove Strapi and Prisma from bot

**Files:**
- Delete: `bot/src/services/strapi.ts`
- Delete: `bot/src/services/__tests__/strapi.test.ts`
- Delete: `bot/src/db/prisma.ts`
- Delete: `bot/src/db/__tests__/prisma.test.ts`
- Delete: `bot/prisma/` (entire folder)
- Modify: `bot/package.json`
- Modify: `bot/Dockerfile`

- [ ] **Step 1: Delete Strapi and Prisma source files**

```bash
rm bot/src/services/strapi.ts
rm bot/src/services/__tests__/strapi.test.ts
rm bot/src/db/prisma.ts
rm bot/src/db/__tests__/prisma.test.ts
rmdir bot/src/db/__tests__
rmdir bot/src/db
rm -rf bot/prisma
```

- [ ] **Step 2: Run all tests to verify nothing is broken**

```bash
cd /path/to/project/bot
npm test
```

Expected: PASS — adminApi and progress tests pass. No references to deleted files.

- [ ] **Step 3: Remove Prisma from `bot/package.json`**

Replace entire `bot/package.json`:

```json
{
  "name": "qazaq-undestik-bot",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test": "jest"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.26.0",
    "@grammyjs/conversations": "^1.2.0",
    "dotenv": "^16.4.5",
    "grammy": "^1.28.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^20.14.0",
    "jest": "^29.7.0",
    "nock": "^13.5.4",
    "ts-jest": "^29.2.3",
    "tsx": "^4.16.2",
    "typescript": "^5.5.4"
  }
}
```

- [ ] **Step 4: Remove Prisma from node_modules and reinstall**

```bash
cd /path/to/project/bot
npm install
```

Expected: package-lock.json updated, no Prisma packages listed

- [ ] **Step 5: Replace `bot/Dockerfile`**

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json .
COPY src ./src
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

- [ ] **Step 6: Run TypeScript compile again to confirm clean build**

```bash
cd /path/to/project/bot
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add bot/src/ bot/package.json bot/package-lock.json bot/Dockerfile
git commit -m "feat: remove Strapi and Prisma from bot"
```

---

## Task 6: Update environment and Docker Compose

**Files:**
- Modify: `.env.example`
- Modify: `docker-compose.yml`

- [ ] **Step 1: Replace `.env.example`**

```
# PostgreSQL
POSTGRES_USER=qazaq
POSTGRES_PASSWORD=changeme

# Bot
BOT_TOKEN=your_telegram_bot_token
ANTHROPIC_API_KEY=your_anthropic_api_key

# Admin panel
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme
ADMIN_SESSION_SECRET=generate_with_openssl_rand_hex_32

# Shared secret for bot→admin API calls (generate with: openssl rand -hex 32)
ADMIN_BOT_SECRET=generate_with_openssl_rand_hex_32
```

- [ ] **Step 2: Replace `docker-compose.yml`**

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
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 10

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
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - admin_uploads:/app/uploads

  bot:
    build: ./bot
    environment:
      BOT_TOKEN: ${BOT_TOKEN}
      ALEM_API_KEY: ${ALEM_API_KEY}
      ADMIN_URL: http://admin:3000
      ADMIN_BOT_SECRET: ${ADMIN_BOT_SECRET}
    depends_on:
      admin:
        condition: service_started

volumes:
  postgres_data:
  admin_uploads:
```

- [ ] **Step 3: Commit**

```bash
git add .env.example docker-compose.yml
git commit -m "chore: update env and docker-compose — remove Strapi, add admin bot API vars"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Delete `bot/prisma/` folder and all Prisma deps | Task 5 |
| Delete `bot/src/db/prisma.ts` | Task 5 |
| Delete `bot/src/services/strapi.ts` | Task 5 |
| Create `bot/src/services/adminApi.ts` | Task 1 |
| Update `bot/src/services/progress.ts` | Task 2 |
| Remove `DATABASE_URL` from bot env | Task 3, Task 6 |
| Add `ADMIN_URL` and `ADMIN_BOT_SECRET` to bot env | Task 3, Task 6 |
| Bot uses `Authorization: Bearer <secret>` header | Task 1 (authHeaders) |
| `getTheory`, `getExercises`, `getTasks`, `getTestQuestions`, `getVideos` | Task 1 |
| `upsertUser`, `saveTestResult`, `saveExerciseResult` | Task 1 |
| Image URL change: `exercise.image?.url` → `exercise.imageUrl` | Task 4 (exercises.ts) |
| Remove Strapi service from docker-compose | Task 6 |
| Add `admin_uploads` volume | Task 6 |

All spec requirements are covered. No placeholders. Types are consistent throughout — `Exercise.imageUrl: string | null` defined in Task 1 and used in Task 4.
