# Topic-Based Exercises & Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Topic` model to group exercises and test questions so that users can pick a topic before starting exercises or tests in the Telegram bot, and replace "ықпал" with "үндестік" in bot UI strings.

**Architecture:** A new `Topic` model is added to the DB with a nullable FK on `Exercise`, `Task`, and `TestQuestion`. The admin panel gets a topics CRUD page plus topic selectors in all content forms. The bot gets a topic selection screen before the exercise/tests conversation. The bot API gets new filtered endpoints.

**Tech Stack:** Next.js 14 (App Router, server components + client forms), Prisma ORM, PostgreSQL, grammY (Telegram bot framework), TypeScript.

---

## File Map

**Created:**
- `admin/prisma/migrations/<timestamp>_add_topics/` — Prisma migration
- `admin/src/app/api/topics/route.ts` — admin CRUD: GET all, POST new
- `admin/src/app/api/topics/[id]/route.ts` — admin CRUD: PUT, DELETE
- `admin/src/app/api/bot/topics/route.ts` — bot GET topics
- `admin/src/app/dashboard/topics/page.tsx` — topics list
- `admin/src/app/dashboard/topics/new/page.tsx` — new topic form
- `admin/src/app/dashboard/topics/[id]/page.tsx` — edit topic page
- `admin/src/app/dashboard/topics/[id]/EditTopicForm.tsx` — client edit form
- `admin/src/app/dashboard/topics/DeleteTopicButton.tsx` — delete button

**Modified:**
- `admin/prisma/schema.prisma` — add Topic model + topicId FK
- `admin/src/app/api/bot/exercises/route.ts` — filter by topicId
- `admin/src/app/api/bot/tasks/route.ts` — filter by topicId
- `admin/src/app/api/bot/test-questions/route.ts` — filter by topicId
- `admin/src/app/api/tasks/route.ts` — accept topicId on create
- `admin/src/app/api/tasks/[id]/route.ts` — accept topicId on update
- `admin/src/app/api/exercises/route.ts` — accept topicId on create
- `admin/src/app/api/exercises/[id]/route.ts` — accept topicId on update
- `admin/src/app/api/test-questions/route.ts` — accept topicId on create
- `admin/src/app/api/test-questions/[id]/route.ts` — accept topicId on update
- `admin/src/types.ts` — add TopicItem
- `admin/src/components/Sidebar.tsx` — add Topics nav link
- `admin/src/app/dashboard/zhattyghu/page.tsx` — group by topic
- `admin/src/app/dashboard/test/page.tsx` — group by topic
- `admin/src/app/dashboard/zhattyghu/document/new/page.tsx` — topic selector
- `admin/src/app/dashboard/zhattyghu/document/[id]/EditTaskForm.tsx` — topic selector
- `admin/src/app/dashboard/zhattyghu/interactive/new/page.tsx` — topic selector
- `admin/src/app/dashboard/zhattyghu/interactive/[id]/EditExerciseForm.tsx` — topic selector
- `admin/src/app/dashboard/test/new/page.tsx` — topic selector
- `admin/src/app/dashboard/test/[id]/EditTestForm.tsx` — topic selector
- `bot/src/services/adminApi.ts` — add Topic type + new methods
- `bot/src/handlers/exercises.ts` — topic selection screen
- `bot/src/handlers/tests.ts` — topic selection screen
- `bot/src/handlers/start.ts` — replace "ықпал" → "үндестік"

---

## Task 1: DB Schema — Add Topic model

**Files:**
- Modify: `admin/prisma/schema.prisma`

- [ ] **Step 1: Update schema**

In `admin/prisma/schema.prisma`, add the Topic model after the Video model and add `topicId` to Exercise, Task, TestQuestion:

```prisma
model Topic {
  id            Int            @id @default(autoincrement())
  name          String         @unique
  order         Int            @default(0)
  exercises     Exercise[]
  tasks         Task[]
  testQuestions TestQuestion[]

  @@map("topics")
}
```

Add to `Exercise` model (before `published`):
```prisma
  topicId     Int?
  topic       Topic?   @relation(fields: [topicId], references: [id], onDelete: SetNull)
```

Add to `Task` model (before `published`):
```prisma
  topicId     Int?
  topic       Topic?   @relation(fields: [topicId], references: [id], onDelete: SetNull)
```

Add to `TestQuestion` model (before `published`):
```prisma
  topicId     Int?
  topic       Topic?   @relation(fields: [topicId], references: [id], onDelete: SetNull)
```

- [ ] **Step 2: Generate and apply migration**

```bash
cd admin && npx prisma migrate dev --name add_topics
```

Expected output: `The following migration(s) have been applied: .../add_topics`

- [ ] **Step 3: Verify Prisma client regenerated**

```bash
cd admin && npx prisma generate
```

Expected: `Generated Prisma Client`

- [ ] **Step 4: Commit**

```bash
git add admin/prisma/schema.prisma admin/prisma/migrations/
git commit -m "feat: add Topic model with nullable FK on Exercise, Task, TestQuestion"
```

---

## Task 2: Admin API — Topics CRUD routes

**Files:**
- Create: `admin/src/app/api/topics/route.ts`
- Create: `admin/src/app/api/topics/[id]/route.ts`

- [ ] **Step 1: Create `admin/src/app/api/topics/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const items = await db.topic.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const { name, order } = (await request.json()) as { name: string; order?: number };
    const item = await db.topic.create({ data: { name, order: order ?? 0 } });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `admin/src/app/api/topics/[id]/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, order } = (await request.json()) as { name: string; order: number };
    const item = await db.topic.update({ where: { id: Number(id) }, data: { name, order } });
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
    await db.topic.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/app/api/topics/
git commit -m "feat: add admin API routes for topics CRUD"
```

---

## Task 3: Bot API — topics endpoint + topicId filters

**Files:**
- Create: `admin/src/app/api/bot/topics/route.ts`
- Modify: `admin/src/app/api/bot/exercises/route.ts`
- Modify: `admin/src/app/api/bot/tasks/route.ts`
- Modify: `admin/src/app/api/bot/test-questions/route.ts`

- [ ] **Step 1: Create `admin/src/app/api/bot/topics/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function GET(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  const items = await db.topic.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}
```

- [ ] **Step 2: Update `admin/src/app/api/bot/exercises/route.ts`**

Replace the entire file:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function GET(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  const { searchParams } = new URL(request.url);
  const topicIdParam = searchParams.get("topicId");
  const where = topicIdParam
    ? { published: true, topicId: Number(topicIdParam) }
    : { published: true };
  const items = await db.exercise.findMany({ where });
  return NextResponse.json(items);
}
```

- [ ] **Step 3: Update `admin/src/app/api/bot/tasks/route.ts`**

Replace the entire file:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function GET(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  const { searchParams } = new URL(request.url);
  const topicIdParam = searchParams.get("topicId");
  const where = topicIdParam
    ? { published: true, topicId: Number(topicIdParam) }
    : { published: true };
  const items = await db.task.findMany({ where, orderBy: { order: "asc" } });
  return NextResponse.json(items);
}
```

- [ ] **Step 4: Update `admin/src/app/api/bot/test-questions/route.ts`**

Replace the entire file:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function GET(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  const { searchParams } = new URL(request.url);
  const topicIdParam = searchParams.get("topicId");
  const where = topicIdParam
    ? { published: true, topicId: Number(topicIdParam) }
    : { published: true };
  const items = await db.testQuestion.findMany({ where });
  return NextResponse.json(items);
}
```

- [ ] **Step 5: Commit**

```bash
git add admin/src/app/api/bot/topics/ admin/src/app/api/bot/exercises/route.ts admin/src/app/api/bot/tasks/route.ts admin/src/app/api/bot/test-questions/route.ts
git commit -m "feat: add bot/topics endpoint and topicId filter to bot API routes"
```

---

## Task 4: Admin CRUD APIs — accept topicId on create/update

**Files:**
- Modify: `admin/src/app/api/tasks/route.ts`
- Modify: `admin/src/app/api/tasks/[id]/route.ts`
- Modify: `admin/src/app/api/exercises/route.ts`
- Modify: `admin/src/app/api/exercises/[id]/route.ts`
- Modify: `admin/src/app/api/test-questions/route.ts`
- Modify: `admin/src/app/api/test-questions/[id]/route.ts`

- [ ] **Step 1: Update `admin/src/app/api/tasks/route.ts`**

Replace the destructured fields to include `topicId`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { title, content, topicId } = (await request.json()) as {
      title: string;
      content: string;
      topicId?: number | null;
    };
    const maxOrder = await db.task.aggregate({ _max: { order: true } });
    const order = (maxOrder._max.order ?? -1) + 1;
    const item = await db.task.create({
      data: { title, content, order, published: true, topicId: topicId ?? null },
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Update `admin/src/app/api/tasks/[id]/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title, content, published, topicId } = (await request.json()) as {
      title: string;
      content: string;
      published: boolean;
      topicId?: number | null;
    };
    const item = await db.task.update({
      where: { id: Number(id) },
      data: { title, content, published, topicId: topicId ?? null },
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

- [ ] **Step 3: Update `admin/src/app/api/exercises/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
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
      topicId?: number | null;
    };
    const item = await db.exercise.create({
      data: { ...body, topicId: body.topicId ?? null, published: true },
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 4: Update `admin/src/app/api/exercises/[id]/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
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
      topicId?: number | null;
    };
    const item = await db.exercise.update({
      where: { id: Number(id) },
      data: { ...body, topicId: body.topicId ?? null },
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

- [ ] **Step 5: Update `admin/src/app/api/test-questions/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: string;
      explanation?: string;
      topicId?: number | null;
    };
    const item = await db.testQuestion.create({
      data: { ...body, topicId: body.topicId ?? null, published: true },
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 6: Update `admin/src/app/api/test-questions/[id]/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      question: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: string;
      explanation?: string;
      published: boolean;
      topicId?: number | null;
    };
    const item = await db.testQuestion.update({
      where: { id: Number(id) },
      data: { ...body, topicId: body.topicId ?? null },
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

- [ ] **Step 7: Commit**

```bash
git add admin/src/app/api/tasks/ admin/src/app/api/exercises/ admin/src/app/api/test-questions/
git commit -m "feat: accept topicId in admin CRUD APIs for tasks, exercises, test-questions"
```

---

## Task 5: Admin types + Sidebar

**Files:**
- Modify: `admin/src/types.ts`
- Modify: `admin/src/components/Sidebar.tsx`

- [ ] **Step 1: Add TopicItem to `admin/src/types.ts`**

Add after the last interface (before the end of file):

```typescript
export interface TopicItem {
  id: number;
  name: string;
  order: number;
}
```

Also add `topicId: number | null` to `TaskItem`, `ExerciseItem`, and `TestQuestionItem`:

In `TaskItem`, add before `published`:
```typescript
  topicId: number | null;
```

In `ExerciseItem`, add before `published`:
```typescript
  topicId: number | null;
```

In `TestQuestionItem`, add before `published`:
```typescript
  topicId: number | null;
```

- [ ] **Step 2: Add Topics link to `admin/src/components/Sidebar.tsx`**

Update the NAV array to add the Topics entry (import `Tag` from lucide-react):

```typescript
import { LogOut, BookOpen, PenLine, FileText, Video, Tag } from "lucide-react";

const NAV = [
  { href: "/dashboard/erezhe",    label: "Ереже",     icon: BookOpen },
  { href: "/dashboard/zhattyghu", label: "Жаттығу",   icon: PenLine  },
  { href: "/dashboard/test",      label: "Тест",      icon: FileText },
  { href: "/dashboard/video",     label: "Видео",     icon: Video    },
  { href: "/dashboard/topics",    label: "Тақырыптар", icon: Tag     },
];
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/types.ts admin/src/components/Sidebar.tsx
git commit -m "feat: add TopicItem type and Topics sidebar link"
```

---

## Task 6: Admin UI — Topics CRUD pages

**Files:**
- Create: `admin/src/app/dashboard/topics/page.tsx`
- Create: `admin/src/app/dashboard/topics/new/page.tsx`
- Create: `admin/src/app/dashboard/topics/[id]/page.tsx`
- Create: `admin/src/app/dashboard/topics/[id]/EditTopicForm.tsx`
- Create: `admin/src/app/dashboard/topics/DeleteTopicButton.tsx`

- [ ] **Step 1: Create `admin/src/app/dashboard/topics/page.tsx`**

```typescript
import Link from "next/link";
import { db } from "@/lib/db";
import DeleteTopicButton from "./DeleteTopicButton";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const items = await db.topic.findMany({ orderBy: { order: "asc" } });
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Тақырыптар</h1>
        <Button asChild>
          <Link href="/dashboard/topics/new">
            <Plus className="mr-1 h-4 w-4" /> Қосу
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Тақырып жоқ.</p>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors${idx < items.length - 1 ? " border-b" : ""}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium truncate">{item.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">реттілік: {item.order}</span>
              </div>
              <div className="flex gap-1 ml-4 shrink-0">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/topics/${item.id}`}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Өңдеу
                  </Link>
                </Button>
                <DeleteTopicButton id={item.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `admin/src/app/dashboard/topics/DeleteTopicButton.tsx`**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteTopicButton({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Тақырыпты жою керек пе? Байланысқан элементтер тақырыпсыз қалады.")) return;
    await fetch(`/api/topics/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
```

- [ ] **Step 3: Create `admin/src/app/dashboard/topics/new/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewTopicPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [order, setOrder] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, order: Number(order) }),
    });
    if (res.ok) {
      router.push("/dashboard/topics");
      router.refresh();
    } else {
      const d = (await res.json()) as { error: string };
      setError(d.error);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Жаңа тақырып</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>Атауы</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Реттілік (order)</Label>
          <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? "Сақталуда..." : "Жарияла"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Болдырмау</Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create `admin/src/app/dashboard/topics/[id]/EditTopicForm.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TopicItem } from "@/types";

export default function EditTopicForm({ item }: { item: TopicItem }) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [order, setOrder] = useState(String(item.order));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/topics/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, order: Number(order) }),
    });
    if (res.ok) {
      router.push("/dashboard/topics");
      router.refresh();
    } else {
      const d = (await res.json()) as { error: string };
      setError(d.error);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Атауы</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>Реттілік (order)</Label>
        <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
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

- [ ] **Step 5: Create `admin/src/app/dashboard/topics/[id]/page.tsx`**

```typescript
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditTopicForm from "./EditTopicForm";
import type { TopicItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditTopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await db.topic.findUnique({ where: { id: Number(id) } });
  if (!item) notFound();
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Тақырыпты өңдеу</h1>
      <EditTopicForm item={item as TopicItem} />
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add admin/src/app/dashboard/topics/
git commit -m "feat: add Topics CRUD pages in admin dashboard"
```

---

## Task 7: Admin UI — Group content by topic in list pages

**Files:**
- Modify: `admin/src/app/dashboard/zhattyghu/page.tsx`
- Modify: `admin/src/app/dashboard/test/page.tsx`

- [ ] **Step 1: Update `admin/src/app/dashboard/zhattyghu/page.tsx`**

Replace the entire file:

```typescript
import Link from "next/link";
import { db } from "@/lib/db";
import DeleteTaskButton from "./DeleteTaskButton";
import DeleteExerciseButton from "./DeleteExerciseButton";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ZhattyghuPage() {
  const [tasks, exercises, topics] = await Promise.all([
    db.task.findMany({ orderBy: { order: "asc" } }),
    db.exercise.findMany(),
    db.topic.findMany({ orderBy: { order: "asc" } }),
  ]);

  const topicMap = new Map(topics.map((t) => [t.id, t.name]));

  function topicLabel(topicId: number | null) {
    if (!topicId) return "Тақырыпсыз";
    return topicMap.get(topicId) ?? "Тақырыпсыз";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Жаттығу</h1>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Документ тапсырмалары ({tasks.length})
          </h2>
          <Button asChild size="sm">
            <Link href="/dashboard/zhattyghu/document/new">
              <Plus className="mr-1 h-4 w-4" /> Қосу
            </Link>
          </Button>
        </div>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">Тапсырма жоқ.</p>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            {tasks.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors${idx < tasks.length - 1 ? " border-b" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-medium truncate">{item.title}</span>
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                    {topicLabel(item.topicId)}
                  </span>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${item.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {item.published ? "Жарияланған" : "Черновик"}
                  </span>
                </div>
                <div className="flex gap-1 ml-4 shrink-0">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/zhattyghu/document/${item.id}`}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Өңдеу
                    </Link>
                  </Button>
                  <DeleteTaskButton id={item.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Интерактивті жаттығулар ({exercises.length})
          </h2>
          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard/zhattyghu/interactive/new">
              <Plus className="mr-1 h-4 w-4" /> Қосу
            </Link>
          </Button>
        </div>
        {exercises.length === 0 ? (
          <p className="text-muted-foreground text-sm">Жаттығу жоқ.</p>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            {exercises.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors${idx < exercises.length - 1 ? " border-b" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm truncate">{item.prompt}</span>
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                    {topicLabel(item.topicId)}
                  </span>
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                    {item.type}
                  </span>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${item.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {item.published ? "Жарияланған" : "Черновик"}
                  </span>
                </div>
                <div className="flex gap-1 ml-4 shrink-0">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/zhattyghu/interactive/${item.id}`}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Өңдеу
                    </Link>
                  </Button>
                  <DeleteExerciseButton id={item.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `admin/src/app/dashboard/test/page.tsx`**

Replace the entire file:

```typescript
import Link from "next/link";
import { db } from "@/lib/db";
import DeleteTestButton from "./DeleteTestButton";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TestPage() {
  const [items, topics] = await Promise.all([
    db.testQuestion.findMany(),
    db.topic.findMany({ orderBy: { order: "asc" } }),
  ]);

  const topicMap = new Map(topics.map((t) => [t.id, t.name]));

  function topicLabel(topicId: number | null) {
    if (!topicId) return "Тақырыпсыз";
    return topicMap.get(topicId) ?? "Тақырыпсыз";
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Тест</h1>
        <Button asChild>
          <Link href="/dashboard/test/new">
            <Plus className="mr-1 h-4 w-4" /> Қосу
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Тест жоқ.</p>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors${idx < items.length - 1 ? " border-b" : ""}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm truncate">{item.question}</span>
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                  {topicLabel(item.topicId)}
                </span>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${item.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {item.published ? "Жарияланған" : "Черновик"}
                </span>
              </div>
              <div className="flex gap-1 ml-4 shrink-0">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/test/${item.id}`}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Өңдеу
                  </Link>
                </Button>
                <DeleteTestButton id={item.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/app/dashboard/zhattyghu/page.tsx admin/src/app/dashboard/test/page.tsx
git commit -m "feat: show topic badge in zhattyghu and test list pages"
```

---

## Task 8: Admin UI — Topic selector in content forms

**Files:**
- Modify: `admin/src/app/dashboard/zhattyghu/document/new/page.tsx`
- Modify: `admin/src/app/dashboard/zhattyghu/document/[id]/EditTaskForm.tsx`
- Modify: `admin/src/app/dashboard/zhattyghu/interactive/new/page.tsx`
- Modify: `admin/src/app/dashboard/zhattyghu/interactive/[id]/EditExerciseForm.tsx`
- Modify: `admin/src/app/dashboard/test/new/page.tsx`
- Modify: `admin/src/app/dashboard/test/[id]/EditTestForm.tsx`
- Modify: `admin/src/app/dashboard/zhattyghu/document/[id]/page.tsx`
- Modify: `admin/src/app/dashboard/zhattyghu/interactive/[id]/page.tsx`
- Modify: `admin/src/app/dashboard/test/[id]/page.tsx`

**Pattern:** Each server page (`[id]/page.tsx`) fetches topics alongside the item and passes them as a `topics` prop. New pages fetch topics via `useEffect`. Topic selector is a `<Select>` with an empty "—" option meaning no topic.

- [ ] **Step 1: Update `admin/src/app/dashboard/zhattyghu/document/[id]/page.tsx`**

```typescript
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditTaskForm from "./EditTaskForm";
import type { TaskItem, TopicItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, topics] = await Promise.all([
    db.task.findUnique({ where: { id: Number(id) } }),
    db.topic.findMany({ orderBy: { order: "asc" } }),
  ]);
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Тапсырманы өңдеу</h1>
      <EditTaskForm item={item as unknown as TaskItem} topics={topics as TopicItem[]} />
    </div>
  );
}
```

- [ ] **Step 2: Update `admin/src/app/dashboard/zhattyghu/document/[id]/EditTaskForm.tsx`**

Replace the entire file:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TaskItem, TopicItem } from "@/types";

export default function EditTaskForm({ item, topics }: { item: TaskItem; topics: TopicItem[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [published, setPublished] = useState(item.published);
  const [topicId, setTopicId] = useState<string>(item.topicId ? String(item.topicId) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/tasks/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, published, topicId: topicId ? Number(topicId) : null }),
    });
    if (res.ok) {
      router.push("/dashboard/zhattyghu");
      router.refresh();
    } else {
      const d = (await res.json()) as { error: string };
      setError(d.error);
      setSaving(false);
    }
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
      <div className="space-y-1">
        <Label>Тақырып (тема)</Label>
        <Select value={topicId} onValueChange={(v) => setTopicId(v === "none" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="— таңдалмаған —" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— таңдалмаған —</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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

- [ ] **Step 3: Update `admin/src/app/dashboard/zhattyghu/document/new/page.tsx`**

Replace the entire file:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TopicItem } from "@/types";

export default function NewTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topicId, setTopicId] = useState("");
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/topics").then((r) => r.json()).then((data) => setTopics(data as TopicItem[]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, topicId: topicId ? Number(topicId) : null }),
    });
    if (res.ok) {
      router.push("/dashboard/zhattyghu");
      router.refresh();
    } else {
      const d = (await res.json()) as { error: string };
      setError(d.error);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа тапсырма (документ)</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>Тақырып</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Мазмұн</Label>
          <RichEditor value={content} onChange={setContent} />
        </div>
        <div className="space-y-1">
          <Label>Тақырып (тема)</Label>
          <Select value={topicId} onValueChange={(v) => setTopicId(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="— таңдалмаған —" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— таңдалмаған —</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? "Сақталуда..." : "Жарияла"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Болдырмау</Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Update `admin/src/app/dashboard/zhattyghu/interactive/[id]/page.tsx`**

```typescript
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditExerciseForm from "./EditExerciseForm";
import type { ExerciseItem, TopicItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, topics] = await Promise.all([
    db.exercise.findUnique({ where: { id: Number(id) } }),
    db.topic.findMany({ orderBy: { order: "asc" } }),
  ]);
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаттығуды өңдеу</h1>
      <EditExerciseForm item={item as unknown as ExerciseItem} topics={topics as TopicItem[]} />
    </div>
  );
}
```

- [ ] **Step 5: Update `admin/src/app/dashboard/zhattyghu/interactive/[id]/EditExerciseForm.tsx`**

Add `topics` prop and `topicId` field. Add to the existing imports:
```typescript
import type { ExerciseItem, TopicItem } from "@/types";
```

Change the component signature to:
```typescript
export default function EditExerciseForm({ item, topics }: { item: ExerciseItem; topics: TopicItem[] }) {
```

Add to the `useState` form state after `imageUrl`:
```typescript
  const [topicId, setTopicId] = useState<string>(item.topicId ? String(item.topicId) : "");
```

In `handleSubmit`, update the payload (both `choice` and non-choice branches) to add `topicId`:
- In the choice branch: `{ ...form, answer: form.correctOption, topicId: topicId ? Number(topicId) : null }`
- In the non-choice branch add `topicId: topicId ? Number(topicId) : null` to the object

Add the topic selector UI before the "Сурет" field:
```tsx
      <div className="space-y-1">
        <Label>Тақырып (тема)</Label>
        <Select value={topicId} onValueChange={(v) => setTopicId(v === "none" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="— таңдалмаған —" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— таңдалмаған —</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
```

- [ ] **Step 6: Update `admin/src/app/dashboard/zhattyghu/interactive/new/page.tsx`**

Add `topicId` state with `useEffect` to fetch topics, identical pattern to Step 3 above. Add topic selector UI before the explanation field. Include `topicId: topicId ? Number(topicId) : null` in the POST payload (both `choice` and non-choice branches).

Full file:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TopicItem } from "@/types";

export default function NewExercisePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    type: "choice" as "suffix" | "choice" | "fill_blank",
    prompt: "", answer: "", correctOption: "A" as "A" | "B" | "C" | "D",
    optionA: "", optionB: "", optionC: "", optionD: "", explanation: "",
  });
  const [topicId, setTopicId] = useState("");
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/topics").then((r) => r.json()).then((data) => setTopics(data as TopicItem[]));
  }, []);

  function set(key: string, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const tid = topicId ? Number(topicId) : null;
    const payload = form.type === "choice"
      ? { type: form.type, prompt: form.prompt, answer: form.correctOption, correctOption: form.correctOption, optionA: form.optionA, optionB: form.optionB, optionC: form.optionC, optionD: form.optionD, explanation: form.explanation, topicId: tid }
      : { type: form.type, prompt: form.prompt, answer: form.answer, explanation: form.explanation, topicId: tid };
    const res = await fetch("/api/exercises", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { router.push("/dashboard/zhattyghu"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа интерактивті жаттығу</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>Тип</Label>
          <Select value={form.type} onValueChange={(v) => set("type", v ?? form.type)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="choice">Таңдау (choice)</SelectItem>
              <SelectItem value="suffix">Жалғау (suffix)</SelectItem>
              <SelectItem value="fill_blank">Бос толтыру (fill_blank)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Сұрақ</Label>
          <Textarea value={form.prompt} onChange={(e) => set("prompt", e.target.value)} className="h-24" required />
        </div>
        {form.type === "choice" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {(["A", "B", "C", "D"] as const).map((opt) => (
                <div key={opt} className="space-y-1">
                  <Label>Вариант {opt}</Label>
                  <Input value={form[`option${opt}` as keyof typeof form] as string}
                    onChange={(e) => set(`option${opt}`, e.target.value)} required />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label>Дұрыс жауап</Label>
              <Select value={form.correctOption} onValueChange={(v) => set("correctOption", v ?? form.correctOption)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["A", "B", "C", "D"] as const).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <div className="space-y-1">
            <Label>Дұрыс жауап</Label>
            <Input value={form.answer} onChange={(e) => set("answer", e.target.value)} required />
          </div>
        )}
        <div className="space-y-1">
          <Label>Тақырып (тема)</Label>
          <Select value={topicId} onValueChange={(v) => setTopicId(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="— таңдалмаған —" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— таңдалмаған —</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Түсіндірме</Label>
          <Textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)} className="h-20" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? "Сақталуда..." : "Жарияла"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Болдырмау</Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 7: Update `admin/src/app/dashboard/test/[id]/page.tsx`**

```typescript
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditTestForm from "./EditTestForm";
import type { TestQuestionItem, TopicItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, topics] = await Promise.all([
    db.testQuestion.findUnique({ where: { id: Number(id) } }),
    db.topic.findMany({ orderBy: { order: "asc" } }),
  ]);
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Тест сұрағын өңдеу</h1>
      <EditTestForm item={item as unknown as TestQuestionItem} topics={topics as TopicItem[]} />
    </div>
  );
}
```

- [ ] **Step 8: Update `admin/src/app/dashboard/test/[id]/EditTestForm.tsx`**

Add `topics: TopicItem[]` to props, add `topicId` state, add topic selector before the "Жарияланған" checkbox, and include `topicId` in the PUT payload.

Change import:
```typescript
import type { TestQuestionItem, TopicItem } from "@/types";
```

Change signature:
```typescript
export default function EditTestForm({ item, topics }: { item: TestQuestionItem; topics: TopicItem[] }) {
```

Add after `saving`/`error` state:
```typescript
  const [topicId, setTopicId] = useState<string>(item.topicId ? String(item.topicId) : "");
```

Update `handleSubmit` body to include `topicId: topicId ? Number(topicId) : null` in the JSON.

Add topic selector before the Checkbox:
```tsx
      <div className="space-y-1">
        <Label>Тақырып (тема)</Label>
        <Select value={topicId} onValueChange={(v) => setTopicId(v === "none" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="— таңдалмаған —" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— таңдалмаған —</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
```

- [ ] **Step 9: Update `admin/src/app/dashboard/test/new/page.tsx`**

Add `topicId` state with `useEffect` to fetch topics. Add topic selector before the explanation field. Include `topicId: topicId ? Number(topicId) : null` in the POST payload.

Full file:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TopicItem } from "@/types";

export default function NewTestPage() {
  const router = useRouter();
  const [form, setForm] = useState({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", explanation: "" });
  const [topicId, setTopicId] = useState("");
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/topics").then((r) => r.json()).then((data) => setTopics(data as TopicItem[]));
  }, []);

  function set(key: string, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/test-questions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, topicId: topicId ? Number(topicId) : null }),
    });
    if (res.ok) { router.push("/dashboard/test"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа тест сұрақ</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>Сұрақ</Label>
          <Textarea value={form.question} onChange={(e) => set("question", e.target.value)} className="h-24" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["A", "B", "C", "D"] as const).map((opt) => (
            <div key={opt} className="space-y-1">
              <Label>Вариант {opt}</Label>
              <Input value={form[`option${opt}` as keyof typeof form]}
                onChange={(e) => set(`option${opt}`, e.target.value)} required />
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <Label>Дұрыс жауап</Label>
          <Select value={form.correctOption} onValueChange={(v) => set("correctOption", v ?? form.correctOption)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["A", "B", "C", "D"] as const).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Тақырып (тема)</Label>
          <Select value={topicId} onValueChange={(v) => setTopicId(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="— таңдалмаған —" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— таңдалмаған —</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Түсіндірме</Label>
          <Textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)} className="h-20" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? "Сақталуда..." : "Жарияла"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Болдырмау</Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 10: Commit**

```bash
git add admin/src/app/dashboard/zhattyghu/ admin/src/app/dashboard/test/
git commit -m "feat: add topic selector to all content create/edit forms"
```

---

## Task 9: Bot — adminApiService updates

**Files:**
- Modify: `bot/src/services/adminApi.ts`
- Modify: `bot/src/services/__tests__/adminApi.test.ts`

- [ ] **Step 1: Write failing tests in `bot/src/services/__tests__/adminApi.test.ts`**

Add to the existing test file:

```typescript
describe("getTopics", () => {
  it("calls /api/bot/topics and returns array", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 1, name: "Ілгерінді үндестік", order: 0 }],
    });
    const topics = await adminApiService.getTopics();
    expect(topics).toEqual([{ id: 1, name: "Ілгерінді үндестік", order: 0 }]);
  });
});

describe("getExercisesByTopic", () => {
  it("calls /api/bot/exercises without param when topicId undefined", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });
    await adminApiService.getExercisesByTopic();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/bot/exercises"),
      expect.any(Object)
    );
  });

  it("appends topicId query param when provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });
    await adminApiService.getExercisesByTopic(5);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("topicId=5"),
      expect.any(Object)
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd bot && npx jest --testPathPattern=adminApi --no-coverage
```

Expected: FAIL — `getTopics is not a function` or similar.

- [ ] **Step 3: Add `Topic` interface and new methods to `bot/src/services/adminApi.ts`**

Add `Topic` interface after the existing interfaces:

```typescript
export interface Topic {
  id: number;
  name: string;
  order: number;
}
```

Add new methods to `adminApiService`:

```typescript
  getTopics(): Promise<Topic[]> {
    return apiGet<Topic>("/api/bot/topics");
  },

  getExercisesByTopic(topicId?: number): Promise<Exercise[]> {
    const path = topicId !== undefined
      ? `/api/bot/exercises?topicId=${topicId}`
      : "/api/bot/exercises";
    return apiGet<Exercise>(path);
  },

  getTasksByTopic(topicId?: number): Promise<Task[]> {
    const path = topicId !== undefined
      ? `/api/bot/tasks?topicId=${topicId}`
      : "/api/bot/tasks";
    return apiGet<Task>(path);
  },

  getTestQuestionsByTopic(topicId?: number): Promise<TestQuestion[]> {
    const path = topicId !== undefined
      ? `/api/bot/test-questions?topicId=${topicId}`
      : "/api/bot/test-questions";
    return apiGet<TestQuestion>(path);
  },
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd bot && npx jest --testPathPattern=adminApi --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add bot/src/services/adminApi.ts bot/src/services/__tests__/adminApi.test.ts
git commit -m "feat: add Topic type and getTopics/getByTopic methods to adminApiService"
```

---

## Task 10: Bot — Topic selection in exercises conversation

**Files:**
- Modify: `bot/src/handlers/exercises.ts`

- [ ] **Step 1: Replace `bot/src/handlers/exercises.ts`**

```typescript
import { InlineKeyboard, InputFile } from "grammy";

import { backToMenuInline } from "../keyboards/menus";
import { type MyConversation, type MyContext } from "../index";
import { adminApiService, type Exercise, type Task, type Topic } from "../services/adminApi";
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

async function runExercises(
  conversation: MyConversation,
  ctx: MyContext,
  tasks: Task[],
  exercises: Exercise[]
): Promise<void> {
  if (tasks.length === 0 && exercises.length === 0) {
    await ctx.reply("Бұл тақырып бойынша жаттығулар әлі жоқ.");
    await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
    await conversation.waitForCallbackQuery("menu");
    return;
  }

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

export async function exercisesConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const topics = await conversation.external(() => adminApiService.getTopics());

  // Build topic selection keyboard
  const topicKb = new InlineKeyboard();
  for (const topic of topics) {
    topicKb.text(topic.name, `topic_${topic.id}`).row();
  }
  topicKb.text("📋 Барлық тақырыптар", "topic_all").row();
  topicKb.text("⬅️ Мәзір", "menu");

  await ctx.reply("📚 Тақырып таңдаңыз:", { reply_markup: topicKb });

  const validCallbacks = [
    ...topics.map((t: Topic) => `topic_${t.id}`),
    "topic_all",
    "menu",
  ];
  const cb = await conversation.waitForCallbackQuery(validCallbacks);
  await cb.answerCallbackQuery();

  if (cb.callbackQuery.data === "menu") return;

  const selectedTopicId =
    cb.callbackQuery.data === "topic_all"
      ? undefined
      : Number(cb.callbackQuery.data.replace("topic_", ""));

  const [tasks, exercises] = await conversation.external(() =>
    Promise.all([
      adminApiService.getTasksByTopic(selectedTopicId),
      adminApiService.getExercisesByTopic(selectedTopicId),
    ])
  );

  await runExercises(conversation, ctx, tasks, exercises);
}
```

- [ ] **Step 2: Commit**

```bash
git add bot/src/handlers/exercises.ts
git commit -m "feat: add topic selection screen to exercises conversation"
```

---

## Task 11: Bot — Topic selection in tests conversation

**Files:**
- Modify: `bot/src/handlers/tests.ts`

- [ ] **Step 1: Replace `bot/src/handlers/tests.ts`**

```typescript
import { InlineKeyboard } from "grammy";

import { backToMenuInline } from "../keyboards/menus";
import { type MyConversation, type MyContext } from "../index";
import { adminApiService, type TestQuestion, type Topic } from "../services/adminApi";

async function runTest(
  conversation: MyConversation,
  ctx: MyContext,
  questions: TestQuestion[]
): Promise<void> {
  if (questions.length === 0) {
    await ctx.reply("Бұл тақырып бойынша тест сұрақтары әлі жоқ.");
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

export async function testsConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const topics = await conversation.external(() => adminApiService.getTopics());

  const topicKb = new InlineKeyboard();
  for (const topic of topics) {
    topicKb.text(topic.name, `topic_${topic.id}`).row();
  }
  topicKb.text("📋 Барлық тақырыптар", "topic_all").row();
  topicKb.text("⬅️ Мәзір", "menu");

  await ctx.reply("📚 Тақырып таңдаңыз:", { reply_markup: topicKb });

  const validCallbacks = [
    ...topics.map((t: Topic) => `topic_${t.id}`),
    "topic_all",
    "menu",
  ];
  const cb = await conversation.waitForCallbackQuery(validCallbacks);
  await cb.answerCallbackQuery();

  if (cb.callbackQuery.data === "menu") return;

  const selectedTopicId =
    cb.callbackQuery.data === "topic_all"
      ? undefined
      : Number(cb.callbackQuery.data.replace("topic_", ""));

  const questions = await conversation.external(() =>
    adminApiService.getTestQuestionsByTopic(selectedTopicId)
  );

  await runTest(conversation, ctx, questions);
}
```

- [ ] **Step 2: Commit**

```bash
git add bot/src/handlers/tests.ts
git commit -m "feat: add topic selection screen to tests conversation"
```

---

## Task 12: Bot — Replace "ықпал" with "үндестік" in UI string

**Files:**
- Modify: `bot/src/handlers/start.ts`

- [ ] **Step 1: Update the greeting string in `bot/src/handlers/start.ts`**

Change line 16 from:
```typescript
    "Сәлем! Мен ықпал заңын үйретемін 📚\n\nТөмендегі мәзірден бөлімді таңдаңыз:",
```
to:
```typescript
    "Сәлем! Мен үндестік заңын үйретемін 📚\n\nТөмендегі мәзірден бөлімді таңдаңыз:",
```

- [ ] **Step 2: Commit**

```bash
git add bot/src/handlers/start.ts
git commit -m "fix: replace 'ықпал' with 'үндестік' in bot greeting"
```

---

## Self-Review Notes

- All 12 tasks map directly to spec sections
- `onDelete: SetNull` on topic FK ensures deleting a topic doesn't cascade-delete exercises/questions
- `apiGet` in adminApi.ts already handles query strings in paths, so `/api/bot/exercises?topicId=5` works without changes to the HTTP helper
- Type consistency: `Topic` is defined in Task 9 and used in Tasks 10 and 11 — both import from `../services/adminApi`
- `topicId` is `number | null` throughout — no mixing with `undefined`
- `"none"` sentinel value for the topic `<Select>` avoids empty string issues with Radix UI Select
