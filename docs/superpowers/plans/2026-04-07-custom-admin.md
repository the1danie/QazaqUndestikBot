# Custom Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js admin panel that replaces the Strapi UI for managing Ереже, Жаттығу (document + interactive), Тест, and Видео content.

**Architecture:** Custom Next.js 14 app in `/admin` folder talks to the existing Strapi REST API. Strapi stays unchanged as the data layer. Admin authenticates with a single username/password stored in `.env`. New Strapi `task` content type handles document-style exercises.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS, TipTap (rich text), bcryptjs (auth), Docker Compose (deployment)

---

## File Map

### New files
- `admin/` — entire Next.js app (new service)
- `admin/Dockerfile`
- `admin/package.json`
- `admin/next.config.ts`
- `admin/tailwind.config.ts`
- `admin/postcss.config.js`
- `admin/src/middleware.ts` — auth cookie check, redirects to /login
- `admin/src/app/layout.tsx` — root layout
- `admin/src/app/login/page.tsx` — login form
- `admin/src/app/dashboard/layout.tsx` — sidebar + auth wrapper
- `admin/src/app/dashboard/page.tsx` — redirects to /dashboard/ereзhe
- `admin/src/app/dashboard/ereзhe/page.tsx` — list
- `admin/src/app/dashboard/ereзhe/new/page.tsx` — create form
- `admin/src/app/dashboard/ereзhe/[documentId]/page.tsx` — edit form
- `admin/src/app/dashboard/zhattyghu/page.tsx` — list with tabs
- `admin/src/app/dashboard/zhattyghu/document/new/page.tsx`
- `admin/src/app/dashboard/zhattyghu/document/[documentId]/page.tsx`
- `admin/src/app/dashboard/zhattyghu/interactive/new/page.tsx`
- `admin/src/app/dashboard/zhattyghu/interactive/[documentId]/page.tsx`
- `admin/src/app/dashboard/test/page.tsx`
- `admin/src/app/dashboard/test/new/page.tsx`
- `admin/src/app/dashboard/test/[documentId]/page.tsx`
- `admin/src/app/dashboard/video/page.tsx`
- `admin/src/app/dashboard/video/new/page.tsx`
- `admin/src/app/dashboard/video/[documentId]/page.tsx`
- `admin/src/app/api/auth/login/route.ts`
- `admin/src/app/api/auth/logout/route.ts`
- `admin/src/components/Sidebar.tsx`
- `admin/src/components/RichEditor.tsx`
- `admin/src/lib/strapi.ts` — Strapi API client
- `admin/src/lib/auth.ts` — cookie helpers
- `admin/src/types.ts` — shared TypeScript interfaces
- `strapi/src/api/task/content-types/task/schema.json` — new content type
- `strapi/src/api/task/content-types/task/lifecycles.ts` — auto-order
- `strapi/src/api/task/controllers/task.ts`
- `strapi/src/api/task/routes/task.ts`
- `strapi/src/api/task/services/task.ts`

### Modified files
- `strapi/src/index.ts` — add task to PUBLIC_PERMISSIONS + getTasks in bot
- `bot/src/services/strapi.ts` — add Task interface + getTasks()
- `bot/src/handlers/exercises.ts` — show document tasks first
- `docker-compose.yml` — add admin service
- `.env.example` — add ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET

---

## Task 1: Strapi `task` content type

**Files:**
- Create: `strapi/src/api/task/content-types/task/schema.json`
- Create: `strapi/src/api/task/content-types/task/lifecycles.ts`
- Create: `strapi/src/api/task/controllers/task.ts`
- Create: `strapi/src/api/task/routes/task.ts`
- Create: `strapi/src/api/task/services/task.ts`
- Modify: `strapi/src/index.ts`

- [ ] **Step 1: Create schema.json**

```json
{
  "kind": "collectionType",
  "collectionName": "tasks",
  "info": {
    "singularName": "task",
    "pluralName": "tasks",
    "displayName": "Тапсырма"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "content": {
      "type": "richtext",
      "required": true
    },
    "order": {
      "type": "integer",
      "default": 0,
      "pluginOptions": {
        "content-manager": {
          "visible": false
        }
      }
    }
  }
}
```

- [ ] **Step 2: Create lifecycles.ts (auto-order)**

```typescript
export default {
  async beforeCreate(event: { params: { data: { order?: number } } }) {
    if (event.params.data.order !== undefined && event.params.data.order !== 0) {
      return;
    }
    const entries = await strapi.documents("api::task.task").findMany({
      sort: { order: "desc" },
      limit: 1,
    });
    const maxOrder = entries.length > 0 ? (entries[0] as unknown as { order: number }).order : -1;
    event.params.data.order = maxOrder + 1;
  },
};
```

- [ ] **Step 3: Create controllers/task.ts**

```typescript
import { factories } from "@strapi/strapi";
export default factories.createCoreController("api::task.task");
```

- [ ] **Step 4: Create routes/task.ts**

```typescript
import { factories } from "@strapi/strapi";
export default factories.createCoreRouter("api::task.task");
```

- [ ] **Step 5: Create services/task.ts**

```typescript
import { factories } from "@strapi/strapi";
export default factories.createCoreService("api::task.task");
```

- [ ] **Step 6: Add task to public permissions in strapi/src/index.ts**

In the `PUBLIC_PERMISSIONS` object, add:
```typescript
'api::task.task': ['find', 'findOne'],
```

- [ ] **Step 7: Rebuild and restart Strapi**

```bash
docker compose build strapi && docker compose up -d strapi
docker compose logs -f strapi
```

Expected: Strapi starts without errors, `/api/tasks` endpoint returns `{"data":[],"meta":{...}}`.

- [ ] **Step 8: Verify endpoint works**

```bash
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" http://localhost:1337/api/tasks
```

Expected: `{"data":[],"meta":{"pagination":{"page":1,"pageSize":25,"pageCount":0,"total":0}}}`

- [ ] **Step 9: Commit**

```bash
git add strapi/src/api/task strapi/src/index.ts
git commit -m "feat: add task content type for document exercises"
```

---

## Task 2: Bot — show document tasks in exercises

**Files:**
- Modify: `bot/src/services/strapi.ts`
- Modify: `bot/src/handlers/exercises.ts`

- [ ] **Step 1: Add Task interface and getTasks() to strapi.ts**

After the `Exercise` interface, add:
```typescript
export interface Task {
  id: number;
  title: string;
  content: string;
  order: number;
}
```

In `strapiService`, add:
```typescript
async getTasks(): Promise<Task[]> {
  return strapiGet<Task>("/api/tasks", {
    "sort[0]": "order:asc",
    "pagination[pageSize]": "100",
    "filters[publishedAt][$notNull]": "true",
  });
},
```

- [ ] **Step 2: Update exercises handler to show tasks first**

Replace the full content of `bot/src/handlers/exercises.ts` with:

```typescript
import { InlineKeyboard, InputFile } from "grammy";

import { backToMenuInline } from "../keyboards/menus";
import { type MyConversation, type MyContext } from "../index";
import { progressService } from "../services/progress";
import { strapiService, type Exercise, type Task } from "../services/strapi";
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
  if (exercise.image?.url) {
    const internalUrl = exercise.image.url.startsWith("http")
      ? exercise.image.url
      : `${config.STRAPI_URL}${exercise.image.url}`;
    const imageBuffer = await fetchImageBuffer(internalUrl);
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
    Promise.all([strapiService.getTasks(), strapiService.getExercises()])
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
  const userId = BigInt(ctx.from!.id);

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
      progressService.saveExerciseResult(userId, exercise.id, isCorrect)
    );

    strapiService
      .updateExerciseStats(Number(userId), exercise.id, isCorrect)
      .catch((err) => console.error("Failed to update exercise stats:", err.message));

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

- [ ] **Step 3: Build bot to verify TypeScript compiles**

```bash
cd bot && npm run build 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add bot/src/services/strapi.ts bot/src/handlers/exercises.ts
git commit -m "feat: bot shows document tasks before interactive exercises"
```

---

## Task 3: Admin app scaffold

**Files:**
- Create: `admin/package.json`
- Create: `admin/next.config.ts`
- Create: `admin/tailwind.config.ts`
- Create: `admin/postcss.config.js`
- Create: `admin/tsconfig.json`
- Create: `admin/Dockerfile`
- Create: `admin/src/app/layout.tsx`
- Create: `admin/src/app/page.tsx`
- Create: `admin/src/types.ts`

- [ ] **Step 1: Create admin/package.json**

```json
{
  "name": "qazaq-admin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -p 3000"
  },
  "dependencies": {
    "next": "14.2.29",
    "react": "^18",
    "react-dom": "^18",
    "bcryptjs": "^2.4.3",
    "@tiptap/react": "^2.4.0",
    "@tiptap/starter-kit": "^2.4.0",
    "@tiptap/extension-image": "^2.4.0",
    "@tiptap/extension-link": "^2.4.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/bcryptjs": "^2.4.6",
    "tailwindcss": "^3.4.1",
    "postcss": "^8",
    "autoprefixer": "^10.0.1"
  }
}
```

- [ ] **Step 2: Create admin/next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 3: Create admin/tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Create admin/postcss.config.js**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create admin/tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 6: Create admin/src/types.ts**

```typescript
export interface StrapiItem {
  id: number;
  documentId: string;
  publishedAt: string | null;
}

export interface TheoryItem extends StrapiItem {
  title: string;
  content: string;
  order: number;
}

export interface TaskItem extends StrapiItem {
  title: string;
  content: string;
  order: number;
}

export interface ExerciseItem extends StrapiItem {
  type: "suffix" | "choice" | "fill_blank";
  prompt: string;
  answer: string;
  correctOption: "A" | "B" | "C" | "D" | null;
  explanation: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
}

export interface TestQuestionItem extends StrapiItem {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string | null;
}

export interface VideoItem extends StrapiItem {
  title: string;
  url: string;
  description: string | null;
}
```

- [ ] **Step 7: Create admin/src/app/layout.tsx**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QazaqUndestik Admin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="kk">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create admin/src/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 9: Create admin/src/app/page.tsx**

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 10: Create admin/Dockerfile**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 11: Install dependencies and verify build locally**

```bash
cd admin && npm install && npm run build 2>&1 | tail -20
```

Expected: Build succeeds, `.next` folder created.

- [ ] **Step 12: Commit**

```bash
cd .. && git add admin/
git commit -m "feat: scaffold Next.js admin app"
```

---

## Task 4: Admin auth (API routes + middleware + login page)

**Files:**
- Create: `admin/src/lib/auth.ts`
- Create: `admin/src/app/api/auth/login/route.ts`
- Create: `admin/src/app/api/auth/logout/route.ts`
- Create: `admin/src/middleware.ts`
- Create: `admin/src/app/login/page.tsx`

- [ ] **Step 1: Create admin/src/lib/auth.ts**

```typescript
export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

export function isValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  return cookieValue === process.env.ADMIN_SESSION_SECRET;
}
```

- [ ] **Step 2: Create admin/src/app/api/auth/login/route.ts**

```typescript
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export async function POST(request: Request) {
  const { username, password } = await request.json() as { username: string; password: string };

  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!validUsername || !validPassword || !sessionSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (username !== validUsername || password !== validPassword) {
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create admin/src/app/api/auth/logout/route.ts**

```typescript
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Create admin/src/middleware.ts**

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session !== process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 5: Create admin/src/app/login/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json() as { error: string };
      setError(data.error);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">QazaqUndestik</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Кіру..." : "Кіру"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Add env vars to .env.example**

Add to `.env.example`:
```
# Admin panel
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme
ADMIN_SESSION_SECRET=generate_with_openssl_rand_hex_32
```

- [ ] **Step 7: Commit**

```bash
git add admin/src/lib/auth.ts admin/src/middleware.ts admin/src/app/login admin/src/app/api .env.example
git commit -m "feat: admin auth with login page and session cookie"
```

---

## Task 5: Admin layout (sidebar + Strapi client)

**Files:**
- Create: `admin/src/lib/strapi.ts`
- Create: `admin/src/components/Sidebar.tsx`
- Create: `admin/src/app/dashboard/layout.tsx`
- Create: `admin/src/app/dashboard/page.tsx`

- [ ] **Step 1: Create admin/src/lib/strapi.ts**

```typescript
const STRAPI_URL = process.env.STRAPI_URL!;
const TOKEN = process.env.STRAPI_API_TOKEN!;

function headers() {
  return { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
}

export async function strapiList<T>(path: string, params: Record<string, string> = {}): Promise<T[]> {
  const url = new URL(`/api/${path}`, STRAPI_URL);
  url.searchParams.set("pagination[pageSize]", "100");
  url.searchParams.set("publicationState", "preview");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`Strapi ${res.status}: ${await res.text()}`);
  const json = await res.json() as { data: T[] };
  return json.data;
}

export async function strapiCreate<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(new URL(`/api/${path}`, STRAPI_URL).toString(), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ data }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strapi ${res.status}: ${await res.text()}`);
  const json = await res.json() as { data: T };
  return json.data;
}

export async function strapiUpdate<T>(path: string, documentId: string, data: unknown): Promise<T> {
  const res = await fetch(new URL(`/api/${path}/${documentId}`, STRAPI_URL).toString(), {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ data }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strapi ${res.status}: ${await res.text()}`);
  const json = await res.json() as { data: T };
  return json.data;
}

export async function strapiDelete(path: string, documentId: string): Promise<void> {
  const res = await fetch(new URL(`/api/${path}/${documentId}`, STRAPI_URL).toString(), {
    method: "DELETE",
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strapi ${res.status}: ${await res.text()}`);
}

export async function strapiPublish(path: string, documentId: string): Promise<void> {
  const res = await fetch(
    new URL(`/api/${path}/${documentId}/actions/publish`, STRAPI_URL).toString(),
    { method: "POST", headers: headers(), cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Strapi publish ${res.status}: ${await res.text()}`);
}

export async function strapiUnpublish(path: string, documentId: string): Promise<void> {
  const res = await fetch(
    new URL(`/api/${path}/${documentId}/actions/unpublish`, STRAPI_URL).toString(),
    { method: "POST", headers: headers(), cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Strapi unpublish ${res.status}: ${await res.text()}`);
}

export async function strapiGetOne<T>(path: string, documentId: string): Promise<T> {
  const res = await fetch(new URL(`/api/${path}/${documentId}`, STRAPI_URL).toString(), {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strapi ${res.status}: ${await res.text()}`);
  const json = await res.json() as { data: T };
  return json.data;
}
```

- [ ] **Step 2: Create admin/src/components/Sidebar.tsx**

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard/ereзhe", label: "📚 Ереже" },
  { href: "/dashboard/zhattyghu", label: "✏️ Жаттығу" },
  { href: "/dashboard/test", label: "📝 Тест" },
  { href: "/dashboard/video", label: "📹 Видео" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="font-bold text-lg">QazaqUndestik</h1>
        <p className="text-xs text-gray-400">Админ панель</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(item.href)
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-gray-400 hover:text-white"
        >
          Шығу →
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Create admin/src/app/dashboard/layout.tsx**

```tsx
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Create admin/src/app/dashboard/page.tsx**

```tsx
import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/dashboard/ereзhe");
}
```

- [ ] **Step 5: Commit**

```bash
git add admin/src/lib/strapi.ts admin/src/components/Sidebar.tsx admin/src/app/dashboard/
git commit -m "feat: admin layout with sidebar and Strapi client"
```

---

## Task 6: Admin — Ереже section

**Files:**
- Create: `admin/src/components/RichEditor.tsx`
- Create: `admin/src/app/dashboard/ereзhe/page.tsx`
- Create: `admin/src/app/dashboard/ereзhe/new/page.tsx`
- Create: `admin/src/app/dashboard/ereзhe/[documentId]/page.tsx`
- Create: `admin/src/app/api/ereзhe/route.ts`
- Create: `admin/src/app/api/ereзhe/[documentId]/route.ts`

- [ ] **Step 1: Create admin/src/components/RichEditor.tsx**

```tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichEditor({ value, onChange }: RichEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive("bold") ? "bg-gray-300" : "hover:bg-gray-200"}`}>
          <b>B</b>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive("italic") ? "bg-gray-300" : "hover:bg-gray-200"}`}>
          <i>I</i>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive("bulletList") ? "bg-gray-300" : "hover:bg-gray-200"}`}>
          • Тізім
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive("orderedList") ? "bg-gray-300" : "hover:bg-gray-200"}`}>
          1. Тізім
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive("heading", { level: 2 }) ? "bg-gray-300" : "hover:bg-gray-200"}`}>
          H2
        </button>
      </div>
      <EditorContent editor={editor} className="prose max-w-none p-4 min-h-[200px] focus:outline-none" />
    </div>
  );
}
```

- [ ] **Step 2: Create admin/src/app/api/ereзhe/route.ts**

```typescript
import { NextResponse } from "next/server";
import { strapiCreate, strapiPublish } from "@/lib/strapi";
import type { TheoryItem } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { title: string; content: string };
    const item = await strapiCreate<TheoryItem>("theories", body);
    await strapiPublish("theories", item.documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create admin/src/app/api/ereзhe/[documentId]/route.ts**

```typescript
import { NextResponse } from "next/server";
import { strapiUpdate, strapiDelete, strapiPublish, strapiUnpublish } from "@/lib/strapi";
import type { TheoryItem } from "@/types";

export async function PUT(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    const body = await request.json() as { title: string; content: string; published: boolean };
    const { published, ...data } = body;
    await strapiUpdate<TheoryItem>("theories", documentId, data);
    if (published) {
      await strapiPublish("theories", documentId);
    } else {
      await strapiUnpublish("theories", documentId);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    await strapiDelete("theories", documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create admin/src/app/dashboard/ereзhe/page.tsx**

```tsx
import Link from "next/link";
import { strapiList } from "@/lib/strapi";
import type { TheoryItem } from "@/types";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function ErezhePage() {
  const items = await strapiList<TheoryItem>("theories", { "sort[0]": "order:asc" });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ереже</h1>
        <Link href="/dashboard/ereзhe/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Қосу
        </Link>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-gray-500">Ереже жоқ.</p>}
        {items.map((item) => (
          <div key={item.documentId} className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-medium">{item.title}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.publishedAt ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {item.publishedAt ? "Жарияланған" : "Черновик"}
              </span>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/ereзhe/${item.documentId}`}
                className="text-sm text-blue-600 hover:underline">Өңдеу</Link>
              <DeleteButton documentId={item.documentId} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create admin/src/app/dashboard/ereзhe/DeleteButton.tsx**

```tsx
"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({ documentId }: { documentId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/ereзhe/${documentId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">
      Жою
    </button>
  );
}
```

- [ ] **Step 6: Create admin/src/app/dashboard/ereзhe/new/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";

export default function NewErezhePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/ereзhe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      router.push("/dashboard/ereзhe");
      router.refresh();
    } else {
      const d = await res.json() as { error: string };
      setError(d.error);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа ереже</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Тақырып</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Мазмұн</label>
          <RichEditor value={content} onChange={setContent} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Сақталуда..." : "Жарияла"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Болдырмау
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 7: Create admin/src/app/dashboard/ereзhe/[documentId]/page.tsx**

```tsx
import EditErezheForm from "./EditErezheForm";
import { strapiGetOne } from "@/lib/strapi";
import type { TheoryItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditErezhePage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const item = await strapiGetOne<TheoryItem>("theories", documentId);
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Ережені өңдеу</h1>
      <EditErezheForm item={item} />
    </div>
  );
}
```

- [ ] **Step 8: Create admin/src/app/dashboard/ereзhe/[documentId]/EditErezheForm.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import type { TheoryItem } from "@/types";

export default function EditErezheForm({ item }: { item: TheoryItem }) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [published, setPublished] = useState(!!item.publishedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/ereзhe/${item.documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, published }),
    });
    if (res.ok) {
      router.push("/dashboard/ereзhe");
      router.refresh();
    } else {
      const d = await res.json() as { error: string };
      setError(d.error);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Тақырып</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Мазмұн</label>
        <RichEditor value={content} onChange={setContent} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="published" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        <label htmlFor="published" className="text-sm">Жарияланған</label>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Сақталуда..." : "Сақтау"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          Болдырмау
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 9: Commit**

```bash
git add admin/src/components/RichEditor.tsx admin/src/app/dashboard/ereзhe admin/src/app/api/ereзhe
git commit -m "feat: admin Ереже section with list, create, edit, delete"
```

---

## Task 7: Admin — Жаттығу document tab

**Files:**
- Create: `admin/src/app/dashboard/zhattyghu/page.tsx`
- Create: `admin/src/app/dashboard/zhattyghu/document/new/page.tsx`
- Create: `admin/src/app/dashboard/zhattyghu/document/[documentId]/page.tsx`
- Create: `admin/src/app/api/tasks/route.ts`
- Create: `admin/src/app/api/tasks/[documentId]/route.ts`

- [ ] **Step 1: Create admin/src/app/api/tasks/route.ts**

```typescript
import { NextResponse } from "next/server";
import { strapiCreate, strapiPublish } from "@/lib/strapi";
import type { TaskItem } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { title: string; content: string };
    const item = await strapiCreate<TaskItem>("tasks", body);
    await strapiPublish("tasks", item.documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create admin/src/app/api/tasks/[documentId]/route.ts**

```typescript
import { NextResponse } from "next/server";
import { strapiUpdate, strapiDelete, strapiPublish, strapiUnpublish } from "@/lib/strapi";
import type { TaskItem } from "@/types";

export async function PUT(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    const body = await request.json() as { title: string; content: string; published: boolean };
    const { published, ...data } = body;
    await strapiUpdate<TaskItem>("tasks", documentId, data);
    if (published) await strapiPublish("tasks", documentId);
    else await strapiUnpublish("tasks", documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    await strapiDelete("tasks", documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create admin/src/app/dashboard/zhattyghu/page.tsx**

```tsx
import Link from "next/link";
import { strapiList } from "@/lib/strapi";
import type { TaskItem, ExerciseItem } from "@/types";
import DeleteTaskButton from "./DeleteTaskButton";
import DeleteExerciseButton from "./DeleteExerciseButton";

export const dynamic = "force-dynamic";

export default async function ZhattyghuPage() {
  const [tasks, exercises] = await Promise.all([
    strapiList<TaskItem>("tasks", { "sort[0]": "order:asc" }),
    strapiList<ExerciseItem>("exercises"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Жаттығу</h1>
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <span className="border-b-2 border-blue-600 pb-2 font-medium text-blue-600">Документ ({tasks.length})</span>
        <span className="pb-2 text-gray-500">Интерактивті ({exercises.length})</span>
      </div>

      {/* Document tasks */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Документ тапсырмалары</h2>
          <Link href="/dashboard/zhattyghu/document/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            + Қосу
          </Link>
        </div>
        <div className="space-y-3">
          {tasks.length === 0 && <p className="text-gray-500 text-sm">Тапсырма жоқ.</p>}
          {tasks.map((item) => (
            <div key={item.documentId} className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-medium">{item.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.publishedAt ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {item.publishedAt ? "Жарияланған" : "Черновик"}
                </span>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/zhattyghu/document/${item.documentId}`}
                  className="text-sm text-blue-600 hover:underline">Өңдеу</Link>
                <DeleteTaskButton documentId={item.documentId} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive exercises */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Интерактивті жаттығулар</h2>
          <Link href="/dashboard/zhattyghu/interactive/new"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
            + Қосу
          </Link>
        </div>
        <div className="space-y-3">
          {exercises.length === 0 && <p className="text-gray-500 text-sm">Жаттығу жоқ.</p>}
          {exercises.map((item) => (
            <div key={item.documentId} className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{item.prompt}</p>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mr-2">{item.type}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.publishedAt ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {item.publishedAt ? "Жарияланған" : "Черновик"}
                </span>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/zhattyghu/interactive/${item.documentId}`}
                  className="text-sm text-blue-600 hover:underline">Өңдеу</Link>
                <DeleteExerciseButton documentId={item.documentId} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create admin/src/app/dashboard/zhattyghu/DeleteTaskButton.tsx**

```tsx
"use client";
import { useRouter } from "next/navigation";

export default function DeleteTaskButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/tasks/${documentId}`, { method: "DELETE" });
    router.refresh();
  }
  return <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">Жою</button>;
}
```

- [ ] **Step 5: Create admin/src/app/dashboard/zhattyghu/document/new/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";

export default function NewTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      router.push("/dashboard/zhattyghu");
      router.refresh();
    } else {
      const d = await res.json() as { error: string };
      setError(d.error);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа тапсырма (документ)</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Тақырып</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Мазмұн</label>
          <RichEditor value={content} onChange={setContent} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Сақталуда..." : "Жарияла"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Болдырмау
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Create admin/src/app/dashboard/zhattyghu/document/[documentId]/page.tsx**

```tsx
import { strapiGetOne } from "@/lib/strapi";
import type { TaskItem } from "@/types";
import EditTaskForm from "./EditTaskForm";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const item = await strapiGetOne<TaskItem>("tasks", documentId);
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Тапсырманы өңдеу</h1>
      <EditTaskForm item={item} />
    </div>
  );
}
```

- [ ] **Step 7: Create admin/src/app/dashboard/zhattyghu/document/[documentId]/EditTaskForm.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import type { TaskItem } from "@/types";

export default function EditTaskForm({ item }: { item: TaskItem }) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [published, setPublished] = useState(!!item.publishedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/tasks/${item.documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, published }),
    });
    if (res.ok) { router.push("/dashboard/zhattyghu"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Тақырып</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Мазмұн</label>
        <RichEditor value={content} onChange={setContent} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="pub" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        <label htmlFor="pub" className="text-sm">Жарияланған</label>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Сақталуда..." : "Сақтау"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg">Болдырмау</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add admin/src/app/dashboard/zhattyghu admin/src/app/api/tasks
git commit -m "feat: admin Жаттығу document tab"
```

---

## Task 8: Admin — Жаттығу interactive tab

**Files:**
- Create: `admin/src/app/api/exercises/route.ts`
- Create: `admin/src/app/api/exercises/[documentId]/route.ts`
- Create: `admin/src/app/dashboard/zhattyghu/DeleteExerciseButton.tsx`
- Create: `admin/src/app/dashboard/zhattyghu/interactive/new/page.tsx`
- Create: `admin/src/app/dashboard/zhattyghu/interactive/[documentId]/page.tsx`
- Create: `admin/src/app/dashboard/zhattyghu/interactive/[documentId]/EditExerciseForm.tsx`

- [ ] **Step 1: Create admin/src/app/api/exercises/route.ts**

```typescript
import { NextResponse } from "next/server";
import { strapiCreate, strapiPublish } from "@/lib/strapi";
import type { ExerciseItem } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const item = await strapiCreate<ExerciseItem>("exercises", body);
    await strapiPublish("exercises", item.documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create admin/src/app/api/exercises/[documentId]/route.ts**

```typescript
import { NextResponse } from "next/server";
import { strapiUpdate, strapiDelete, strapiPublish, strapiUnpublish } from "@/lib/strapi";
import type { ExerciseItem } from "@/types";

export async function PUT(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    const body = await request.json() as Record<string, unknown> & { published: boolean };
    const { published, ...data } = body;
    await strapiUpdate<ExerciseItem>("exercises", documentId, data);
    if (published) await strapiPublish("exercises", documentId);
    else await strapiUnpublish("exercises", documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    await strapiDelete("exercises", documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create admin/src/app/dashboard/zhattyghu/DeleteExerciseButton.tsx**

```tsx
"use client";
import { useRouter } from "next/navigation";

export default function DeleteExerciseButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/exercises/${documentId}`, { method: "DELETE" });
    router.refresh();
  }
  return <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">Жою</button>;
}
```

- [ ] **Step 4: Create admin/src/app/dashboard/zhattyghu/interactive/new/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewExercisePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    type: "choice" as "suffix" | "choice" | "fill_blank",
    prompt: "",
    answer: "",
    correctOption: "A" as "A" | "B" | "C" | "D",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    explanation: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = form.type === "choice"
      ? { type: form.type, prompt: form.prompt, answer: form.correctOption, correctOption: form.correctOption, optionA: form.optionA, optionB: form.optionB, optionC: form.optionC, optionD: form.optionD, explanation: form.explanation }
      : { type: form.type, prompt: form.prompt, answer: form.answer, explanation: form.explanation };
    const res = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { router.push("/dashboard/zhattyghu"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа интерактивті жаттығу</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Тип</label>
          <select value={form.type} onChange={(e) => set("type", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2">
            <option value="choice">Таңдау (choice)</option>
            <option value="suffix">Жалғау (suffix)</option>
            <option value="fill_blank">Бос толтыру (fill_blank)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Сұрақ</label>
          <textarea value={form.prompt} onChange={(e) => set("prompt", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24" required />
        </div>
        {form.type === "choice" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {(["A", "B", "C", "D"] as const).map((opt) => (
                <div key={opt}>
                  <label className="block text-sm font-medium mb-1">Вариант {opt}</label>
                  <input value={form[`option${opt}` as keyof typeof form] as string}
                    onChange={(e) => set(`option${opt}`, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Дұрыс жауап</label>
              <select value={form.correctOption} onChange={(e) => set("correctOption", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">Дұрыс жауап</label>
            <input value={form.answer} onChange={(e) => set("answer", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Түсіндірме</label>
          <textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
            {saving ? "Сақталуда..." : "Жарияла"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg">Болдырмау</button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Create admin/src/app/dashboard/zhattyghu/interactive/[documentId]/page.tsx**

```tsx
import { strapiGetOne } from "@/lib/strapi";
import type { ExerciseItem } from "@/types";
import EditExerciseForm from "./EditExerciseForm";

export const dynamic = "force-dynamic";

export default async function EditExercisePage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const item = await strapiGetOne<ExerciseItem>("exercises", documentId);
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаттығуды өңдеу</h1>
      <EditExerciseForm item={item} />
    </div>
  );
}
```

- [ ] **Step 6: Create admin/src/app/dashboard/zhattyghu/interactive/[documentId]/EditExerciseForm.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExerciseItem } from "@/types";

export default function EditExerciseForm({ item }: { item: ExerciseItem }) {
  const router = useRouter();
  const [form, setForm] = useState({
    type: item.type,
    prompt: item.prompt,
    answer: item.answer,
    correctOption: item.correctOption ?? "A",
    optionA: item.optionA ?? "",
    optionB: item.optionB ?? "",
    optionC: item.optionC ?? "",
    optionD: item.optionD ?? "",
    explanation: item.explanation ?? "",
    published: !!item.publishedAt,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = form.type === "choice"
      ? { type: form.type, prompt: form.prompt, answer: form.correctOption, correctOption: form.correctOption, optionA: form.optionA, optionB: form.optionB, optionC: form.optionC, optionD: form.optionD, explanation: form.explanation, published: form.published }
      : { type: form.type, prompt: form.prompt, answer: form.answer, explanation: form.explanation, published: form.published };
    const res = await fetch(`/api/exercises/${item.documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { router.push("/dashboard/zhattyghu"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Тип</label>
        <select value={form.type} onChange={(e) => set("type", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2">
          <option value="choice">Таңдау (choice)</option>
          <option value="suffix">Жалғау (suffix)</option>
          <option value="fill_blank">Бос толтыру (fill_blank)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Сұрақ</label>
        <textarea value={form.prompt} onChange={(e) => set("prompt", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24" required />
      </div>
      {form.type === "choice" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {(["A", "B", "C", "D"] as const).map((opt) => (
              <div key={opt}>
                <label className="block text-sm font-medium mb-1">Вариант {opt}</label>
                <input value={form[`option${opt}` as keyof typeof form] as string}
                  onChange={(e) => set(`option${opt}`, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Дұрыс жауап</label>
            <select value={form.correctOption} onChange={(e) => set("correctOption", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="A">A</option><option value="B">B</option>
              <option value="C">C</option><option value="D">D</option>
            </select>
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1">Дұрыс жауап</label>
          <input value={form.answer} onChange={(e) => set("answer", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Түсіндірме</label>
        <textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="pub" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
        <label htmlFor="pub" className="text-sm">Жарияланған</label>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Сақталуда..." : "Сақтау"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg">Болдырмау</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add admin/src/app/dashboard/zhattyghu admin/src/app/api/exercises
git commit -m "feat: admin Жаттығу interactive tab"
```

---

## Task 9: Admin — Тест section

**Files:**
- Create: `admin/src/app/api/test-questions/route.ts`
- Create: `admin/src/app/api/test-questions/[documentId]/route.ts`
- Create: `admin/src/app/dashboard/test/page.tsx`
- Create: `admin/src/app/dashboard/test/DeleteTestButton.tsx`
- Create: `admin/src/app/dashboard/test/new/page.tsx`
- Create: `admin/src/app/dashboard/test/[documentId]/page.tsx`
- Create: `admin/src/app/dashboard/test/[documentId]/EditTestForm.tsx`

- [ ] **Step 1: Create admin/src/app/api/test-questions/route.ts**

```typescript
import { NextResponse } from "next/server";
import { strapiCreate, strapiPublish } from "@/lib/strapi";
import type { TestQuestionItem } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const item = await strapiCreate<TestQuestionItem>("test-questions", body);
    await strapiPublish("test-questions", item.documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create admin/src/app/api/test-questions/[documentId]/route.ts**

```typescript
import { NextResponse } from "next/server";
import { strapiUpdate, strapiDelete, strapiPublish, strapiUnpublish } from "@/lib/strapi";
import type { TestQuestionItem } from "@/types";

export async function PUT(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    const body = await request.json() as Record<string, unknown> & { published: boolean };
    const { published, ...data } = body;
    await strapiUpdate<TestQuestionItem>("test-questions", documentId, data);
    if (published) await strapiPublish("test-questions", documentId);
    else await strapiUnpublish("test-questions", documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    await strapiDelete("test-questions", documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create admin/src/app/dashboard/test/page.tsx**

```tsx
import Link from "next/link";
import { strapiList } from "@/lib/strapi";
import type { TestQuestionItem } from "@/types";
import DeleteTestButton from "./DeleteTestButton";

export const dynamic = "force-dynamic";

export default async function TestPage() {
  const items = await strapiList<TestQuestionItem>("test-questions");
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Тест</h1>
        <Link href="/dashboard/test/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Қосу</Link>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-gray-500">Тест жоқ.</p>}
        {items.map((item) => (
          <div key={item.documentId} className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{item.question}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.publishedAt ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {item.publishedAt ? "Жарияланған" : "Черновик"}
              </span>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/test/${item.documentId}`}
                className="text-sm text-blue-600 hover:underline">Өңдеу</Link>
              <DeleteTestButton documentId={item.documentId} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create admin/src/app/dashboard/test/DeleteTestButton.tsx**

```tsx
"use client";
import { useRouter } from "next/navigation";

export default function DeleteTestButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/test-questions/${documentId}`, { method: "DELETE" });
    router.refresh();
  }
  return <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">Жою</button>;
}
```

- [ ] **Step 5: Create admin/src/app/dashboard/test/new/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTestPage() {
  const router = useRouter();
  const [form, setForm] = useState({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", explanation: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/test-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { router.push("/dashboard/test"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа тест сұрақ</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Сұрақ</label>
          <textarea value={form.question} onChange={(e) => set("question", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["A", "B", "C", "D"] as const).map((opt) => (
            <div key={opt}>
              <label className="block text-sm font-medium mb-1">Вариант {opt}</label>
              <input value={form[`option${opt}` as keyof typeof form]}
                onChange={(e) => set(`option${opt}`, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Дұрыс жауап</label>
          <select value={form.correctOption} onChange={(e) => set("correctOption", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2">
            <option value="A">A</option><option value="B">B</option>
            <option value="C">C</option><option value="D">D</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Түсіндірме</label>
          <textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Сақталуда..." : "Жарияла"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg">Болдырмау</button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Create admin/src/app/dashboard/test/[documentId]/page.tsx**

```tsx
import { strapiGetOne } from "@/lib/strapi";
import type { TestQuestionItem } from "@/types";
import EditTestForm from "./EditTestForm";

export const dynamic = "force-dynamic";

export default async function EditTestPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const item = await strapiGetOne<TestQuestionItem>("test-questions", documentId);
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Тест сұрақты өңдеу</h1>
      <EditTestForm item={item} />
    </div>
  );
}
```

- [ ] **Step 7: Create admin/src/app/dashboard/test/[documentId]/EditTestForm.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TestQuestionItem } from "@/types";

export default function EditTestForm({ item }: { item: TestQuestionItem }) {
  const router = useRouter();
  const [form, setForm] = useState({
    question: item.question, optionA: item.optionA, optionB: item.optionB,
    optionC: item.optionC, optionD: item.optionD, correctOption: item.correctOption,
    explanation: item.explanation ?? "", published: !!item.publishedAt,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string | boolean) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/test-questions/${item.documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { router.push("/dashboard/test"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Сұрақ</label>
        <textarea value={form.question} onChange={(e) => set("question", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["A", "B", "C", "D"] as const).map((opt) => (
          <div key={opt}>
            <label className="block text-sm font-medium mb-1">Вариант {opt}</label>
            <input value={form[`option${opt}` as keyof typeof form] as string}
              onChange={(e) => set(`option${opt}`, e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Дұрыс жауап</label>
        <select value={form.correctOption} onChange={(e) => set("correctOption", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2">
          <option value="A">A</option><option value="B">B</option>
          <option value="C">C</option><option value="D">D</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Түсіндірме</label>
        <textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="pub" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
        <label htmlFor="pub" className="text-sm">Жарияланған</label>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Сақталуда..." : "Сақтау"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg">Болдырмау</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add admin/src/app/dashboard/test admin/src/app/api/test-questions
git commit -m "feat: admin Тест section"
```

---

## Task 10: Admin — Видео section

**Files:**
- Create: `admin/src/app/api/videos/route.ts`
- Create: `admin/src/app/api/videos/[documentId]/route.ts`
- Create: `admin/src/app/dashboard/video/page.tsx`
- Create: `admin/src/app/dashboard/video/DeleteVideoButton.tsx`
- Create: `admin/src/app/dashboard/video/new/page.tsx`
- Create: `admin/src/app/dashboard/video/[documentId]/page.tsx`
- Create: `admin/src/app/dashboard/video/[documentId]/EditVideoForm.tsx`

- [ ] **Step 1: Create admin/src/app/api/videos/route.ts**

```typescript
import { NextResponse } from "next/server";
import { strapiCreate, strapiPublish } from "@/lib/strapi";
import type { VideoItem } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const item = await strapiCreate<VideoItem>("videos", body);
    await strapiPublish("videos", item.documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create admin/src/app/api/videos/[documentId]/route.ts**

```typescript
import { NextResponse } from "next/server";
import { strapiUpdate, strapiDelete, strapiPublish, strapiUnpublish } from "@/lib/strapi";
import type { VideoItem } from "@/types";

export async function PUT(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    const body = await request.json() as Record<string, unknown> & { published: boolean };
    const { published, ...data } = body;
    await strapiUpdate<VideoItem>("videos", documentId, data);
    if (published) await strapiPublish("videos", documentId);
    else await strapiUnpublish("videos", documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    await strapiDelete("videos", documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create admin/src/app/dashboard/video/page.tsx**

```tsx
import Link from "next/link";
import { strapiList } from "@/lib/strapi";
import type { VideoItem } from "@/types";
import DeleteVideoButton from "./DeleteVideoButton";

export const dynamic = "force-dynamic";

export default async function VideoPage() {
  const items = await strapiList<VideoItem>("videos");
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Видео</h1>
        <Link href="/dashboard/video/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Қосу</Link>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-gray-500">Видео жоқ.</p>}
        {items.map((item) => (
          <div key={item.documentId} className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-gray-500 truncate max-w-xs">{item.url}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.publishedAt ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {item.publishedAt ? "Жарияланған" : "Черновик"}
              </span>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/video/${item.documentId}`}
                className="text-sm text-blue-600 hover:underline">Өңдеу</Link>
              <DeleteVideoButton documentId={item.documentId} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create admin/src/app/dashboard/video/DeleteVideoButton.tsx**

```tsx
"use client";
import { useRouter } from "next/navigation";

export default function DeleteVideoButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/videos/${documentId}`, { method: "DELETE" });
    router.refresh();
  }
  return <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">Жою</button>;
}
```

- [ ] **Step 5: Create admin/src/app/dashboard/video/new/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewVideoPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", url: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { router.push("/dashboard/video"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа видео</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Тақырып</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">URL (YouTube сілтемесі)</label>
          <input value={form.url} onChange={(e) => set("url", e.target.value)} type="url"
            className="w-full border border-gray-300 rounded-lg px-3 py-2" required
            placeholder="https://youtube.com/watch?v=..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Сипаттама</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Сақталуда..." : "Жарияла"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg">Болдырмау</button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Create admin/src/app/dashboard/video/[documentId]/page.tsx**

```tsx
import { strapiGetOne } from "@/lib/strapi";
import type { VideoItem } from "@/types";
import EditVideoForm from "./EditVideoForm";

export const dynamic = "force-dynamic";

export default async function EditVideoPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const item = await strapiGetOne<VideoItem>("videos", documentId);
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Видеоны өңдеу</h1>
      <EditVideoForm item={item} />
    </div>
  );
}
```

- [ ] **Step 7: Create admin/src/app/dashboard/video/[documentId]/EditVideoForm.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VideoItem } from "@/types";

export default function EditVideoForm({ item }: { item: VideoItem }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: item.title, url: item.url, description: item.description ?? "", published: !!item.publishedAt,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string | boolean) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/videos/${item.documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { router.push("/dashboard/video"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Тақырып</label>
        <input value={form.title} onChange={(e) => set("title", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">URL</label>
        <input value={form.url} onChange={(e) => set("url", e.target.value)} type="url"
          className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Сипаттама</label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="pub" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
        <label htmlFor="pub" className="text-sm">Жарияланған</label>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Сақталуда..." : "Сақтау"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg">Болдырмау</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add admin/src/app/dashboard/video admin/src/app/api/videos
git commit -m "feat: admin Видео section"
```

---

## Task 11: Docker integration + .env

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.example`

- [ ] **Step 1: Add admin service to docker-compose.yml**

Add after the `bot` service:

```yaml
  admin:
    build: ./admin
    environment:
      STRAPI_URL: http://strapi:1337
      STRAPI_API_TOKEN: ${STRAPI_API_TOKEN}
      ADMIN_USERNAME: ${ADMIN_USERNAME}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      ADMIN_SESSION_SECRET: ${ADMIN_SESSION_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      strapi:
        condition: service_started
```

- [ ] **Step 2: Add env vars to .env (local)**

Add to your local `.env` file (not committed):
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
ADMIN_SESSION_SECRET=run_openssl_rand_hex_32_to_generate
```

Generate session secret:
```bash
openssl rand -hex 32
```

- [ ] **Step 3: Build and start admin**

```bash
docker compose build admin && docker compose up -d admin
docker compose logs -f admin
```

Expected: admin starts on port 3000, no errors.

- [ ] **Step 4: Verify login works**

Open `http://localhost:3000` in browser.
- Should redirect to `/login`
- Enter credentials from .env
- Should redirect to `/dashboard/ereзhe`

- [ ] **Step 5: Test each section**

- Create a new Ереже, verify it appears in Strapi and in bot
- Create a document task, verify bot shows it in Жаттығу
- Create an interactive exercise, verify bot works
- Create a test question
- Add a video

- [ ] **Step 6: Final commit**

```bash
git add docker-compose.yml .env.example
git commit -m "feat: add admin service to docker-compose"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Single user auth with login/password — Task 4
- ✅ Ереже section (list, create, edit, delete, publish) — Task 6
- ✅ Жаттығу document tab — Task 7
- ✅ Жаттығу interactive tab — Task 8
- ✅ Тест section — Task 9
- ✅ Видео section — Task 10
- ✅ New `task` Strapi content type — Task 1
- ✅ Bot shows document tasks — Task 2
- ✅ Docker integration — Task 11
- ✅ Next.js + Tailwind + TipTap — Task 3

**Placeholder scan:** No TBDs found.

**Type consistency:** All types defined in `src/types.ts` (Task 3) and referenced consistently across Tasks 4–10. `documentId: string` used throughout for Strapi v5 mutations.
