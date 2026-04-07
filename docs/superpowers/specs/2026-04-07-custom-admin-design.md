# Custom Admin Panel Design

**Date:** 2026-04-07  
**Project:** QazaqUndestikBot

## Overview

Replace the Strapi admin UI with a custom Next.js admin panel. Strapi remains as the backend (database + REST API). The custom admin is a new service added to the existing Docker Compose setup.

**Data flow:**
```
Заказчица → Custom Admin (Next.js :3000) → Strapi API (:1337) → PostgreSQL
                                                                      ↑
                                                                    Bot
```

---

## Architecture

### New service: `/admin`

A Next.js app in a new `/admin` folder at the project root. Added as a separate service in `docker-compose.yml`, exposed on port `3000`.

### Strapi stays unchanged (mostly)

Strapi continues to serve the bot and the admin's API requests. One addition: a new `task` content type for document-style exercises (see below).

---

## Authentication

- Single user — credentials stored in `.env`: `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- Login page at `/login` — submits to a Next.js API route that verifies credentials and sets an httpOnly cookie (session valid 24 hours)
- All other pages redirect to `/login` if cookie is missing or expired
- No registration, no database for auth

---

## Sections

### Ереже (Theory)
- List view: title, published status, edit/delete buttons
- Create/Edit form: `title` (text input) + `content` (rich text editor)
- Publish/unpublish toggle
- Strapi content type: `api::theory.theory` (existing)

### Жаттығу (Exercises) — two tabs

**Tab 1: Документ**
- List view: title, published status, edit/delete
- Create/Edit form: `title` (text input) + `content` (rich text editor)
- Strapi content type: `api::task.task` **(new)**
- Bot shows these as readable document cards in the Жаттығу section

**Tab 2: Интерактивное**
- List view: type, prompt preview, published status, edit/delete
- Create/Edit form:
  - `type`: dropdown (suffix / choice / fill_blank)
  - `prompt`: textarea
  - `answer`: text input (for suffix/fill_blank)
  - `correctOption`: dropdown A/B/C/D (shown only when type=choice)
  - `optionA`, `optionB`, `optionC`, `optionD`: text inputs (shown only when type=choice)
  - `explanation`: textarea
  - `image`: file upload
- Strapi content type: `api::exercise.exercise` (existing)

### Тест (Test Questions)
- List view: question preview, published status, edit/delete
- Create/Edit form: `question`, `optionA–D`, `correctOption` (dropdown A/B/C/D), `explanation`
- Strapi content type: `api::test-question.test-question` (existing)

### Видео (Videos)
- List view: title, URL, published status, edit/delete
- Create/Edit form: `title`, `url`, `description`
- Strapi content type: `api::video.video` (existing)

---

## New Strapi Content Type: `task`

**File:** `strapi/src/api/task/content-types/task/schema.json`

Fields:
- `title`: string, required
- `content`: richtext, required
- `order`: integer, default 0 (auto-incremented via lifecycle hook, hidden from admin)

Bot changes:
- `strapiService.getTasks()` — fetches published tasks sorted by order
- Жаттығу section in bot shows document tasks first, then interactive exercises

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Built-in routing, API routes for auth, easy Docker deploy |
| UI | Tailwind CSS | Fast styling, no design system overhead |
| Rich text editor | TipTap | Lightweight, React-native, outputs HTML |
| Auth | httpOnly cookie + bcrypt | Simple, secure, no third-party needed |
| HTTP client | fetch (built-in) | No extra dependencies |

---

## Docker

New service in `docker-compose.yml`:
```yaml
admin:
  build: ./admin
  environment:
    ADMIN_USERNAME: ${ADMIN_USERNAME}
    ADMIN_PASSWORD: ${ADMIN_PASSWORD}
    STRAPI_URL: http://strapi:1337
    STRAPI_API_TOKEN: ${STRAPI_API_TOKEN}
  ports:
    - "3000:3000"
  depends_on:
    - strapi
```

---

## Bot Changes

1. Add `strapiService.getTasks()` — fetches `api::task` items sorted by order
2. Update `exercisesConversation` — show document tasks as readable text before interactive exercises
3. Interface `Task`: `{ id, title, content, order }`

---

## Out of Scope

- User management (only one admin)
- Statistics/analytics dashboard
- Mobile app for admin
- Image gallery management
