# QazaqUndestikBot — Design Spec

**Date:** 2026-04-02
**Project:** Educational Telegram bot for 5th grade Kazakh language students
**Topic:** Закон сингармонизма (үндестік заңы)

---

## 1. Overview

A Telegram bot that teaches 5th grade students the law of vowel harmony (үндестік заңы) in the Kazakh language. The bot provides theory, video links, exercises, tests, and free Q&A via AI. Content is managed by a teacher through a Strapi CMS panel.

**Interface language:** Kazakh  
**Target audience:** 5th grade students and teachers

---

## 2. Technical Stack

| Component | Technology |
|-----------|------------|
| Bot | Node.js + TypeScript + Grammy |
| CMS | Strapi v5 |
| Database | PostgreSQL |
| ORM (progress) | Prisma |
| AI | Claude Haiku 3 (`claude-haiku-20240307`) via `@anthropic-ai/sdk` |
| Hosting | Digital Ocean (single droplet) |
| Containerization | Docker Compose |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────┐
│                 Digital Ocean Droplet            │
│                                                  │
│  ┌──────────────┐    ┌─────────────────────┐    │
│  │  Grammy bot  │───▶│   Strapi v5 CMS     │    │
│  │  (Node.js)   │    │   (port 1337)       │    │
│  └──────┬───────┘    └──────────┬──────────┘    │
│         │                       │               │
│         │            ┌──────────▼──────────┐    │
│         └───────────▶│    PostgreSQL        │    │
│                       │  - strapi (content) │    │
│                       │  - progress (bot)   │    │
│                       └─────────────────────┘    │
│                                                  │
│  Bot → Claude Haiku 3 API (external)             │
└─────────────────────────────────────────────────┘
```

The bot calls Strapi REST API directly on each user request (no caching). For a class of 20–40 students this is well within limits. One PostgreSQL instance serves both Strapi (content) and the bot's progress tables (separate schemas).

---

## 4. Project Structure

```
qazaq-undestik-bot/
├── bot/
│   ├── src/
│   │   ├── index.ts              # entry point, Grammy polling
│   │   ├── config.ts             # env vars
│   │   ├── handlers/
│   │   │   ├── start.ts          # /start, main menu
│   │   │   ├── theory.ts         # Theory section
│   │   │   ├── video.ts          # Video section
│   │   │   ├── exercises.ts      # Exercises section
│   │   │   ├── tests.ts          # Test section
│   │   │   └── aiChat.ts         # Free Q&A via AI
│   │   ├── services/
│   │   │   ├── strapi.ts         # HTTP client to Strapi REST API
│   │   │   ├── ai.ts             # Claude Haiku client
│   │   │   └── progress.ts       # Write progress to PostgreSQL
│   │   ├── keyboards/
│   │   │   └── menus.ts          # Reply and Inline keyboards
│   │   └── db/
│   │       └── prisma.ts         # Prisma client singleton
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── .env.example
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-04-02-qazaq-undestik-bot-design.md
```

---

## 5. CMS — Strapi Collections

### Theory
```
title:    String   (e.g. "Буын үндестігі")
content:  RichText (explanation with examples)
order:    Integer  (display order)
```

### Videos
```
title:       String
url:         String  (any platform: YouTube, RuTube, Bilim Land, etc.)
description: Text
```

### Tests
```
question:      String
optionA:       String
optionB:       String
optionC:       String
optionD:       String
correctOption: Enum (A | B | C | D)
explanation:   Text
```

### Exercises
```
type:        Enum (suffix | choice | fill_blank)
prompt:      Text   (task description)
answer:      String (correct answer)
explanation: Text   (shown after attempt)
image:       Media  (JPG/PNG/WebP, max 5MB, optional)
```

---

## 6. Database Schema — Progress (Prisma)

```prisma
model User {
  id        BigInt   @id         // Telegram user_id
  username  String?
  createdAt DateTime @default(now())
  testResults     TestResult[]
  exerciseResults ExerciseResult[]
}

model TestResult {
  id        Int      @id @default(autoincrement())
  userId    BigInt
  score     Int      // number of correct answers
  total     Int      // total questions
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model ExerciseResult {
  id          Int      @id @default(autoincrement())
  userId      BigInt
  exerciseId  Int      // Strapi content ID
  isCorrect   Boolean
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}
```

---

## 7. Bot Flow and FSM

### Main Menu (Reply Keyboard)
```
┌─────────────────────────────────┐
│  📚 Теория    📹 Видео          │
│  ✏️ Жаттығу   📝 Тест           │
│       ❓ Сұрақ қою              │
└─────────────────────────────────┘
```

### Conversation States (Grammy conversations plugin)

**IDLE** → user selects a menu item

**THEORY**
1. Fetch theory items from Strapi, show list as Inline buttons
2. User selects a topic → show full content
3. Return to menu button

**VIDEO**
1. Fetch videos from Strapi
2. Show each as: title + description + URL
3. Return to menu button

**EXERCISE**
1. Fetch exercises from Strapi, show sequentially (by order of creation)
2. Show prompt (+ image if present)
3. `type=choice` → show Inline buttons A/B/C/D
4. `type=suffix | fill_blank` → wait for text input
5. Check answer:
   - Normalize: trim + lowercase
   - Exact match against `answer` field
   - Show ✅ correct / ❌ incorrect + explanation
6. Save ExerciseResult to DB
7. Offer: next exercise or return to menu

**TEST**
1. Fetch all test questions from Strapi (5–10)
2. Show questions one by one with Inline buttons A/B/C/D
3. After last question: show score (X out of N correct)
4. Show explanation for each question
5. Save TestResult to DB
6. Return to menu button

**AI_CHAT**
1. Prompt user to type their question
2. Send to Claude Haiku with system prompt:
   > "Сен 5-сынып оқушыларына арналған оқыту ботысың. Тақырып: қазақ тілінің үндестік заңы. Тек осы тақырып бойынша қазақша жауап бер, қысқа және түсінікті етіп."
3. Return AI response
4. Remain in AI_CHAT state (user can ask follow-up)
5. Return to menu via button

### Answer Checking
- **suffix / fill_blank**: normalize (trim, lowercase) + exact string match. No AI used.
- **choice**: Inline button callback, server-side check.
- AI is used **only** for free Q&A section.

---

## 8. Environment Variables

```env
BOT_TOKEN=               # Telegram Bot Token
ANTHROPIC_API_KEY=       # Claude Haiku API key
DATABASE_URL=            # postgresql://user:pass@postgres:5432/qazaq
STRAPI_URL=              # http://strapi:1337
STRAPI_API_TOKEN=        # Strapi read-only API token
```

---

## 9. Deployment

### docker-compose.yml services
```
postgres  → internal port 5432
strapi    → public port 1337 (teacher admin panel)
bot       → polling mode, no exposed ports
```

### Startup order
```
postgres → strapi (waits for DB) → bot (waits for Strapi)
```

Strapi is accessible to the teacher at `http://<droplet-ip>:1337/admin`. The bot runs in long-polling mode — no nginx or SSL needed for the bot itself. Nginx + certbot for Strapi can be added post-MVP.

---

## 10. Security

- No personal data collected beyond Telegram `user_id` and learning progress
- Strapi admin panel protected by login/password
- All external API calls use HTTPS
- Strapi API token used with read-only permissions for bot access

---

## 11. Acceptance Criteria

- Bot responds to `/start` and shows main menu
- All 5 sections (Theory, Video, Exercises, Test, Q&A) work correctly
- Content added via CMS appears in the bot
- Free questions are answered by AI in Kazakh, appropriate for 5th grade
- CMS is accessible and allows adding/editing content
- Bot runs stably for 24 hours after delivery

---

## 12. Out of Scope (future)

- New learning topics
- Audio tasks / voice input
- Gamification (points, levels, achievements)
- Teacher progress dashboard
- Web version / mobile app
