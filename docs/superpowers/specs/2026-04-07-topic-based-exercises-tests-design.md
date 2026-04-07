# Topic-Based Exercises & Tests — Design Spec

**Date:** 2026-04-07  
**Status:** Approved

---

## Overview

Three changes to the QazaqUndestikBot project:

1. Replace the Kazakh text string "ықпал" with "үндестік" in bot UI strings (not DB content).
2. Add topic-based selection for exercises (Жаттығу) in the Telegram bot.
3. Add topic-based selection for tests (Тест) in the Telegram bot.

---

## 1. Database Schema

### New model: `Topic`

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

### Changes to existing models

Add `topicId Int?` as a nullable FK referencing `Topic` to:
- `Exercise`
- `Task`
- `TestQuestion`

Items without a topic (`topicId = null`) are excluded from topic-specific views but appear in "Барлық тақырыптар" (all topics) mode.

---

## 2. Admin Panel

### New page: `/dashboard/topics`

- Lists all topics sorted by `order`
- Actions: Add, Edit (name + order), Delete
- Deleting a topic sets `topicId = null` on all linked items (cascade set null)
- Link added to sidebar navigation

### Updated forms

- `Exercise` (interactive) create/edit form: optional `<select>` for topic
- `Task` (document) create/edit form: optional `<select>` for topic
- `TestQuestion` create/edit form: optional `<select>` for topic

### Updated list pages

- `/dashboard/zhattyghu`: exercises and tasks grouped by topic
- `/dashboard/test`: questions grouped by topic

---

## 3. Bot API (admin Next.js API routes)

### New endpoint

- `GET /api/bot/topics` — returns all topics sorted by `order`

### Updated endpoints

- `GET /api/bot/exercises?topicId=5` — returns published exercises+tasks for the given topic; omit `topicId` to return all published
- `GET /api/bot/test-questions?topicId=5` — returns published questions for the given topic; omit `topicId` to return all published

### `adminApiService` additions (bot side)

```ts
getTopics(): Promise<Topic[]>
getExercisesByTopic(topicId?: number): Promise<Exercise[]>
getTasksByTopic(topicId?: number): Promise<Task[]>
getTestQuestionsByTopic(topicId?: number): Promise<TestQuestion[]>
```

Existing `getExercises()`, `getTasks()`, `getTestQuestions()` remain unchanged (used internally by the "all topics" path).

---

## 4. Bot — Topic Selection Flow

When the user taps **Жаттығу** or **Тест**, the bot first shows a topic selection screen:

```
📚 Тақырып таңдаңыз:

[ Ілгерінді үндестік ]
[ Кейінгі үндестік   ]
[ Дыбыс үндестігі   ]
─────────────────────
[ 📋 Барлық тақырыптар ]
[ ⬅️ Мәзір            ]
```

- Topics are fetched from `/api/bot/topics` and rendered as inline buttons, one per row.
- "Барлық тақырыптар" triggers the existing flow (all items).
- If a topic is selected but has no exercises/questions, the bot replies: "Бұл тақырып бойынша жаттығулар әлі жоқ." and returns to the topic selection screen.
- After topic selection, the standard exercise/test conversation runs with only items from that topic.

### Implementation note

`exercisesConversation` and `testsConversation` receive an optional `topicId` parameter. The topic selection step is prepended to both conversations.

---

## 5. Text Replacement

Replace the Kazakh UI string "ықпал" with "үндестік" in bot source files only (not in database content — that is managed by the user via the admin panel).

Affected files: any `.ts` file under `bot/src/` containing Казakh UI strings with "ықпал". This is a targeted string replacement, not a global rename.

---

## Out of Scope

- Progress tracking per topic (no per-topic score saved)
- Reordering topics via drag-and-drop in admin
- Topics for Theory or Video content
