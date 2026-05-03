# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal schedule + task dashboard. Single-user, mobile + desktop (PWA). Stack: **Next.js 15 App Router + TypeScript + Tailwind**, **Supabase** (Postgres + Auth) for persistence, **Google Calendar API** for external schedule sync. Visual direction is "Notion minimal + Trello color accents" — neutral surface, vivid category/priority chips.

## Commands

```bash
npm install          # first run
npm run dev          # http://localhost:3000
npm run build        # production build
npm run start        # serve built app
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run db:push      # apply supabase/schema.sql via supabase CLI
```

No test runner is wired up yet. If you add one, prefer `vitest` and put specs next to source as `*.test.ts(x)`.

## Architecture

### Data flow

```
RSC page ──▶ src/lib/{tasks,notes,google-calendar}.ts ──▶ Supabase (RLS)
                                              │
                                              └────▶ Google Calendar API (OAuth cookie)
```

- **Server Components fetch data directly** via the `src/lib/*` accessors. Don't introduce a separate API layer for first-party data unless something needs to be called from the client.
- **Each lib file degrades gracefully** when env vars are missing: `tasks.ts` returns demo seed data, `google-calendar.ts` returns `[]`. This keeps `npm run dev` usable before any credentials are configured. Preserve that fallback when editing.
- **Mutations go through `/api/*` route handlers** (e.g. `/api/notes` posted by the QuickNote form). When adding mutations, follow the same pattern rather than client-side Supabase calls — it keeps the service-role key server-side.

### Google Calendar OAuth

Three routes under `src/app/api/google/`:
- `auth/` — redirect to Google consent
- `callback/` — exchange code → set HTTP-only cookie `g_cal_token`
- `events/` — JSON endpoint reading the cookie

The cookie stores the full token JSON (access + refresh). `lib/google-calendar.ts:getAuthorizedClient` is the single read point — extend there if token refresh logic is needed.

### Supabase

Schema lives in `supabase/schema.sql`. **Row Level Security is enabled on every table** with an `owner` policy keyed on `auth.uid() = user_id`. Any new table MUST follow this pattern or queries will silently return empty. Use `getServerSupabase()` for user-scoped reads/writes; reserve `getServiceSupabase()` for admin-only paths (cron, migrations).

### Theming

Color tokens live in two places that must stay in sync:
- `tailwind.config.ts` → `colors.accent.*` (used in JSX as `bg-accent-violet` etc.)
- `src/lib/theme.ts` → `categoryColors` / `priorityColors` (used as inline `style` for dynamic colors that Tailwind can't statically extract)

When adding a new category or priority, update both `src/types/index.ts` (the union), `theme.ts` (the color), and `supabase/schema.sql` (the CHECK constraint).

### Routing & layout

App Router with three top-level routes: `/` (dashboard grid), `/tasks`, `/calendar`. The dashboard at `/` composes the same widget components used standalone on the other pages — they accept an `expanded` prop to switch between compact and full layouts. Keep widgets self-contained server components so the dashboard stays composable.

## Conventions

- Path alias `@/*` → `src/*`.
- Korean copy in UI; code identifiers and comments in English.
- Server components by default. Add `"use client"` only for interactivity.
- Don't import `googleapis` into client bundles — it's Node-only.
