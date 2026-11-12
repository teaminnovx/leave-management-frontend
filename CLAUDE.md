# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Next.js 16 (App Router, `cacheComponents` on, Turbopack) + React 19 + Auth.js v5 beta + Zod 4 + Tailwind 4. The APIs differ from older Next.js: check `node_modules/next/dist/docs/` before writing framework code. For example, route protection lives in `src/proxy.ts` (exporting `proxy`), not `middleware.ts`. Project skills `nextjs` and `authjs` (`.claude/skills/`) map topics to the version-matched docs and type definitions in `node_modules`; load them before framework or auth work.

## Commands

```bash
npm run dev        # dev server on http://localhost:3000
npm run build      # production build (also the type check)
npm run lint       # eslint
npm run db:reset   # delete data/ so the sample data is reseeded on next load
```

There is no test suite. Copy `.env.example` to `.env.local` and set `AUTH_SECRET` (`npx auth secret`). Run `db:reset` when switching branches, because the `data/db.json` shape changes between them.

## Workshop context

This is a reference app for a workshop. Branches `01-setup` → `05-keycloak-auth` build on each other (see the README table), and each module stands in for a piece of the Spring Boot stack: Auth.js/`requireRole` ↔ Spring Security + Keycloak, `src/lib/workflow.ts` ↔ Flowable, Zod ↔ DTO + Bean Validation, server action → service → `src/lib/db.ts` ↔ Controller → Service → Repository. Keep that layering when you add features.

## Architecture

**Layers.** Feature code lives in `src/modules/<feature>/` (`leave-request`, `leave-review`, `leave-tracking`), each with `actions.ts` (`"use server"`), `service.ts`, `schema.ts` and client components. Pages in `src/app/(app)/` call services directly for reads and pass server actions to forms for writes.
- Server actions authorize with `requireRole(...)`, call the service, translate `ValidationError` / `DomainError` (`src/lib/errors.ts`) into form state (`fieldErrors` or `error`), and rethrow anything else. `DomainError.field` attaches the message to a form input.
- Services hold the business rules and do all writes inside `transaction()`.

**Persistence.** `src/lib/db.ts` is a JSON-file repository (`data/db.json`, seeded from `src/lib/seed.ts` when missing). `read(fn)` for queries, `transaction(fn)` for writes: `fn` runs synchronously on a loaded copy and the file is only saved if it returns, so throwing inside it rolls back. Do not `await` inside a transaction; do async work (e.g. storing uploads) before it and clean up on failure, as `saveApplication` does. Uploads go to `data/uploads/<uuid>` via `src/modules/leave-request/storage.ts` (magic-byte MIME check, 5 MB cap) and are served through `src/app/api/files/[id]/route.ts`.

**Workflow.** Only `fire()` in `src/lib/workflow.ts` may change `application.status`, along the `TRANSITIONS` table (role + allowed from-states). It calls `recordTransition()` in `src/modules/leave-tracking/events.ts`, which writes the audit entry and notifications in the same transaction. Add new status changes as transitions there rather than setting `status` directly.

**Auth.** `src/auth.ts` configures Auth.js with Keycloak as a public client (PKCE, no secret); the issuer is built from `KEYCLOAK_URL` + `KEYCLOAK_REALM`. On sign-in, realm roles are read from the access token (`SUPERVISOR`/`HR_ADMIN`, normalized, strongest wins, else `EMPLOYEE`) and the user is upserted into `db.users` with id `kc-<sub>`. Tokens are kept in the JWT session cookie and refreshed in the `jwt` callback. `src/proxy.ts` only redirects signed-out visitors; real authorization is `requireUser`/`requireRole` in `src/lib/auth.ts` on every page and action, plus `canView`/`supervises` in `src/lib/access.ts` for record-level access. Sign-out (`src/lib/session-actions.ts`) also ends the Keycloak session. Keycloak users get no `supervisorId`, so supervisor/employee links only exist for seeded users.

**Backend API.** `src/lib/backend.ts` is a server-only axios client for the Spring Boot API at `BACKEND_API_URL`, attaching the user's Keycloak access token via `getAccessToken()`. `/api-check` uses `probe()` to show raw responses.

**Roles and navigation.** `ROLES`, statuses and labels are in `src/lib/types.ts`; per-role home page and sidebar links in `src/lib/nav.ts`.

**Styling.** Tailwind 4 with design tokens (`paper`, `sheet`, `ink`, `muted`, `line`, `file`, `tape`, `stamp`, `amber`) and component classes (`page-title`, `ledger`, `spine-link`, …) defined in `src/app/globals.css`. Use these rather than raw colors.
