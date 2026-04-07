# shadcn/ui Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace plain Tailwind buttons and form elements in the existing admin panel with shadcn/ui components for a polished, consistent UI.

**Architecture:** Install shadcn/ui into the existing `admin/` Next.js app, add the needed components, then update all pages to use them. No structural changes — only UI layer.

**Tech Stack:** shadcn/ui, Radix UI (via shadcn), class-variance-authority, clsx, tailwind-merge, lucide-react (icons)

---

## Components needed

- `Button` — all action buttons (+ Қосу, Сақтау, Жарияла, Болдырмау, Жою, Шығу)
- `Badge` — published/draft status tags
- `Card`, `CardContent` — list item containers
- `Input` — text inputs
- `Textarea` — multiline inputs
- `Label` — form labels
- `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` — dropdowns
- `Checkbox` — published toggle

---

## Task 1: Initialize shadcn/ui

**Files:**
- Modify: `admin/package.json` (deps added by shadcn init)
- Create: `admin/components.json` (shadcn config)
- Create: `admin/src/lib/utils.ts`
- Modify: `admin/tailwind.config.ts`
- Modify: `admin/src/app/globals.css`

- [ ] **Step 1: Run shadcn init inside admin folder**

```bash
cd /Volumes/KINGSTON/Dev/Projects/QazaqUndestikBot/admin
npx shadcn@latest init -d
```

When prompted:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

This creates `components.json`, updates `tailwind.config.ts`, and adds CSS variables to `globals.css`.

- [ ] **Step 2: Add all needed components**

```bash
npx shadcn@latest add button badge card input textarea label select checkbox
```

Expected: Creates files in `admin/src/components/ui/` — `button.tsx`, `badge.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx`, `select.tsx`, `checkbox.tsx`

- [ ] **Step 3: Add lucide-react for icons**

```bash
npm install lucide-react
```

- [ ] **Step 4: Verify build still works**

```bash
npm run build 2>&1 | tail -10
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
cd ..
git add admin/
git commit -m "chore: install shadcn/ui and base components"
```

---

## Task 2: Update Sidebar

**Files:**
- Modify: `admin/src/components/Sidebar.tsx`

- [ ] **Step 1: Update Sidebar.tsx with shadcn Button**

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const NAV = [
  { href: "/dashboard/erezhe", label: "📚 Ереже" },
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
          <Link key={item.href} href={item.href}>
            <Button
              variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
              className={`w-full justify-start text-sm ${
                pathname.startsWith(item.href)
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-700"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Шығу
        </Button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/components/Sidebar.tsx
git commit -m "feat: shadcn Button in Sidebar"
```

---

## Task 3: Update Login page

**Files:**
- Modify: `admin/src/app/login/page.tsx`

- [ ] **Step 1: Update login/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">QazaqUndestik</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="username">Логин</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Кіру..." : "Кіру"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/app/login/page.tsx
git commit -m "feat: shadcn Card, Input, Button in login page"
```

---

## Task 4: Update Ереже section

**Files:**
- Modify: `admin/src/app/dashboard/erezhe/page.tsx`
- Modify: `admin/src/app/dashboard/erezhe/DeleteButton.tsx`
- Modify: `admin/src/app/dashboard/erezhe/new/page.tsx`
- Modify: `admin/src/app/dashboard/erezhe/[documentId]/EditErezheForm.tsx`

- [ ] **Step 1: Update erezhe/page.tsx**

```tsx
import Link from "next/link";
import { strapiList } from "@/lib/strapi";
import type { TheoryItem } from "@/types";
import DeleteButton from "./DeleteButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ErezhePage() {
  const items = await strapiList<TheoryItem>("theories", { "sort[0]": "order:asc" });

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
          <Card key={item.documentId}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{item.title}</p>
                <Badge variant={item.publishedAt ? "default" : "secondary"}>
                  {item.publishedAt ? "Жарияланған" : "Черновик"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/erezhe/${item.documentId}`}>
                    <Pencil className="mr-1 h-3 w-3" /> Өңдеу
                  </Link>
                </Button>
                <DeleteButton documentId={item.documentId} />
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

export default function DeleteButton({ documentId }: { documentId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/erezhe/${documentId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      <Trash2 className="mr-1 h-3 w-3" /> Жою
    </Button>
  );
}
```

- [ ] **Step 3: Update erezhe/new/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    const res = await fetch("/api/erezhe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      router.push("/dashboard/erezhe");
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
        <div className="space-y-1">
          <Label>Тақырып</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Мазмұн</Label>
          <RichEditor value={content} onChange={setContent} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Сақталуда..." : "Жарияла"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Болдырмау
          </Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Update erezhe/[documentId]/EditErezheForm.tsx**

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
  const [published, setPublished] = useState(!!item.publishedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/erezhe/${item.documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, published }),
    });
    if (res.ok) {
      router.push("/dashboard/erezhe");
      router.refresh();
    } else {
      const d = await res.json() as { error: string };
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
      <div className="flex items-center gap-2">
        <Checkbox id="published" checked={published} onCheckedChange={(v) => setPublished(!!v)} />
        <Label htmlFor="published">Жарияланған</Label>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Сақталуда..." : "Сақтау"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Болдырмау
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add admin/src/app/dashboard/erezhe/
git commit -m "feat: shadcn components in Ереже section"
```

---

## Task 5: Update Жаттығу section

**Files:**
- Modify: `admin/src/app/dashboard/zhattyghu/page.tsx`
- Modify: `admin/src/app/dashboard/zhattyghu/DeleteTaskButton.tsx`
- Modify: `admin/src/app/dashboard/zhattyghu/DeleteExerciseButton.tsx`
- Modify: `admin/src/app/dashboard/zhattyghu/document/new/page.tsx`
- Modify: `admin/src/app/dashboard/zhattyghu/document/[documentId]/EditTaskForm.tsx`
- Modify: `admin/src/app/dashboard/zhattyghu/interactive/new/page.tsx`
- Modify: `admin/src/app/dashboard/zhattyghu/interactive/[documentId]/EditExerciseForm.tsx`

- [ ] **Step 1: Update zhattyghu/page.tsx**

```tsx
import Link from "next/link";
import { strapiList } from "@/lib/strapi";
import type { TaskItem, ExerciseItem } from "@/types";
import DeleteTaskButton from "./DeleteTaskButton";
import DeleteExerciseButton from "./DeleteExerciseButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ZhattyghuPage() {
  const [tasks, exercises] = await Promise.all([
    strapiList<TaskItem>("tasks", { "sort[0]": "order:asc" }),
    strapiList<ExerciseItem>("exercises"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Жаттығу</h1>

      {/* Document tasks */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Документ тапсырмалары ({tasks.length})</h2>
          <Button asChild size="sm">
            <Link href="/dashboard/zhattyghu/document/new">
              <Plus className="mr-1 h-4 w-4" /> Қосу
            </Link>
          </Button>
        </div>
        <div className="space-y-3">
          {tasks.length === 0 && <p className="text-gray-500 text-sm">Тапсырма жоқ.</p>}
          {tasks.map((item) => (
            <Card key={item.documentId}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant={item.publishedAt ? "default" : "secondary"}>
                    {item.publishedAt ? "Жарияланған" : "Черновик"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/zhattyghu/document/${item.documentId}`}>
                      <Pencil className="mr-1 h-3 w-3" /> Өңдеу
                    </Link>
                  </Button>
                  <DeleteTaskButton documentId={item.documentId} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Interactive exercises */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Интерактивті жаттығулар ({exercises.length})</h2>
          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard/zhattyghu/interactive/new">
              <Plus className="mr-1 h-4 w-4" /> Қосу
            </Link>
          </Button>
        </div>
        <div className="space-y-3">
          {exercises.length === 0 && <p className="text-gray-500 text-sm">Жаттығу жоқ.</p>}
          {exercises.map((item) => (
            <Card key={item.documentId}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{item.prompt}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">{item.type}</Badge>
                    <Badge variant={item.publishedAt ? "default" : "secondary"}>
                      {item.publishedAt ? "Жарияланған" : "Черновик"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/zhattyghu/interactive/${item.documentId}`}>
                      <Pencil className="mr-1 h-3 w-3" /> Өңдеу
                    </Link>
                  </Button>
                  <DeleteExerciseButton documentId={item.documentId} />
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

export default function DeleteTaskButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/tasks/${documentId}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      <Trash2 className="mr-1 h-3 w-3" /> Жою
    </Button>
  );
}
```

`DeleteExerciseButton.tsx`:
```tsx
"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteExerciseButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/exercises/${documentId}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      <Trash2 className="mr-1 h-3 w-3" /> Жою
    </Button>
  );
}
```

- [ ] **Step 3: Update document/new/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    if (res.ok) { router.push("/dashboard/zhattyghu"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
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

- [ ] **Step 4: Update document/[documentId]/EditTaskForm.tsx**

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

- [ ] **Step 5: Update interactive/new/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewExercisePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    type: "choice" as "suffix" | "choice" | "fill_blank",
    prompt: "", answer: "", correctOption: "A" as "A" | "B" | "C" | "D",
    optionA: "", optionB: "", optionC: "", optionD: "", explanation: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = form.type === "choice"
      ? { type: form.type, prompt: form.prompt, answer: form.correctOption, correctOption: form.correctOption, optionA: form.optionA, optionB: form.optionB, optionC: form.optionC, optionD: form.optionD, explanation: form.explanation }
      : { type: form.type, prompt: form.prompt, answer: form.answer, explanation: form.explanation };
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
          <Select value={form.type} onValueChange={(v) => set("type", v)}>
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
              <Select value={form.correctOption} onValueChange={(v) => set("correctOption", v)}>
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

- [ ] **Step 6: Update interactive/[documentId]/EditExerciseForm.tsx**

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
    explanation: item.explanation ?? "", published: !!item.publishedAt,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string | boolean) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = form.type === "choice"
      ? { type: form.type, prompt: form.prompt, answer: form.correctOption, correctOption: form.correctOption, optionA: form.optionA, optionB: form.optionB, optionC: form.optionC, optionD: form.optionD, explanation: form.explanation, published: form.published }
      : { type: form.type, prompt: form.prompt, answer: form.answer, explanation: form.explanation, published: form.published };
    const res = await fetch(`/api/exercises/${item.documentId}`, {
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
                  onChange={(e) => set(`option${opt}`, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <Label>Дұрыс жауап</Label>
            <Select value={form.correctOption} onValueChange={(v) => set("correctOption", v)}>
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
        <Label>Түсіндірме</Label>
        <Textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)} className="h-20" />
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

- [ ] **Step 7: Commit**

```bash
git add admin/src/app/dashboard/zhattyghu/
git commit -m "feat: shadcn components in Жаттығу section"
```

---

## Task 6: Update Тест section

**Files:**
- Modify: `admin/src/app/dashboard/test/page.tsx`
- Modify: `admin/src/app/dashboard/test/DeleteTestButton.tsx`
- Modify: `admin/src/app/dashboard/test/new/page.tsx`
- Modify: `admin/src/app/dashboard/test/[documentId]/EditTestForm.tsx`

- [ ] **Step 1: Update test/page.tsx**

```tsx
import Link from "next/link";
import { strapiList } from "@/lib/strapi";
import type { TestQuestionItem } from "@/types";
import DeleteTestButton from "./DeleteTestButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TestPage() {
  const items = await strapiList<TestQuestionItem>("test-questions");
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Тест</h1>
        <Button asChild>
          <Link href="/dashboard/test/new"><Plus className="mr-2 h-4 w-4" /> Қосу</Link>
        </Button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-gray-500">Тест жоқ.</p>}
        {items.map((item) => (
          <Card key={item.documentId}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium text-sm">{item.question}</p>
                <Badge variant={item.publishedAt ? "default" : "secondary"}>
                  {item.publishedAt ? "Жарияланған" : "Черновик"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/test/${item.documentId}`}>
                    <Pencil className="mr-1 h-3 w-3" /> Өңдеу
                  </Link>
                </Button>
                <DeleteTestButton documentId={item.documentId} />
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

export default function DeleteTestButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/test-questions/${documentId}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      <Trash2 className="mr-1 h-3 w-3" /> Жою
    </Button>
  );
}
```

- [ ] **Step 3: Update test/new/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
          <Select value={form.correctOption} onValueChange={(v) => set("correctOption", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["A", "B", "C", "D"] as const).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
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

- [ ] **Step 4: Update test/[documentId]/EditTestForm.tsx**

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
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { router.push("/dashboard/test"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Сұрақ</Label>
        <Textarea value={form.question} onChange={(e) => set("question", e.target.value)} className="h-24" required />
      </div>
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
        <Select value={form.correctOption} onValueChange={(v) => set("correctOption", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(["A", "B", "C", "D"] as const).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Түсіндірме</Label>
        <Textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)} className="h-20" />
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

- [ ] **Step 5: Commit**

```bash
git add admin/src/app/dashboard/test/
git commit -m "feat: shadcn components in Тест section"
```

---

## Task 7: Update Видео section

**Files:**
- Modify: `admin/src/app/dashboard/video/page.tsx`
- Modify: `admin/src/app/dashboard/video/DeleteVideoButton.tsx`
- Modify: `admin/src/app/dashboard/video/new/page.tsx`
- Modify: `admin/src/app/dashboard/video/[documentId]/EditVideoForm.tsx`

- [ ] **Step 1: Update video/page.tsx**

```tsx
import Link from "next/link";
import { strapiList } from "@/lib/strapi";
import type { VideoItem } from "@/types";
import DeleteVideoButton from "./DeleteVideoButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VideoPage() {
  const items = await strapiList<VideoItem>("videos");
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Видео</h1>
        <Button asChild>
          <Link href="/dashboard/video/new"><Plus className="mr-2 h-4 w-4" /> Қосу</Link>
        </Button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-gray-500">Видео жоқ.</p>}
        {items.map((item) => (
          <Card key={item.documentId}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-gray-500 truncate max-w-xs">{item.url}</p>
                <Badge variant={item.publishedAt ? "default" : "secondary"}>
                  {item.publishedAt ? "Жарияланған" : "Черновик"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/video/${item.documentId}`}>
                    <Pencil className="mr-1 h-3 w-3" /> Өңдеу
                  </Link>
                </Button>
                <DeleteVideoButton documentId={item.documentId} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update video/DeleteVideoButton.tsx**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteVideoButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/videos/${documentId}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      <Trash2 className="mr-1 h-3 w-3" /> Жою
    </Button>
  );
}
```

- [ ] **Step 3: Update video/new/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { router.push("/dashboard/video"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа видео</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>Тақырып</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>URL (YouTube сілтемесі)</Label>
          <Input value={form.url} onChange={(e) => set("url", e.target.value)} type="url"
            placeholder="https://youtube.com/watch?v=..." required />
        </div>
        <div className="space-y-1">
          <Label>Сипаттама</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="h-24" />
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

- [ ] **Step 4: Update video/[documentId]/EditVideoForm.tsx**

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
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { router.push("/dashboard/video"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Тақырып</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>URL</Label>
        <Input value={form.url} onChange={(e) => set("url", e.target.value)} type="url" required />
      </div>
      <div className="space-y-1">
        <Label>Сипаттама</Label>
        <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="h-24" />
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

- [ ] **Step 5: Final build check**

```bash
cd /Volumes/KINGSTON/Dev/Projects/QazaqUndestikBot/admin
npm run build 2>&1 | tail -15
```

Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
cd ..
git add admin/src/app/dashboard/video/
git commit -m "feat: shadcn components in Видео section — all sections complete"
```
