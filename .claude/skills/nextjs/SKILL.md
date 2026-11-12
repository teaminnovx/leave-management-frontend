---
name: nextjs
description: Next.js 16.4 (App Router, cacheComponents, Turbopack, proxy.ts) reference for this repo. Use before writing or changing any page, layout, route handler, server action, proxy, caching/revalidation, next.config or other Next.js framework code, and whenever a Next.js API, convention or error message is unfamiliar.
---

# Next.js 16 in this repo

This project runs **Next.js 16.4.5** with React 19.3. Many APIs differ from older Next.js versions, so don't rely on memory. The docs for this exact version ship in `node_modules/next/dist/docs/`. Read the relevant file before writing code, and follow any deprecation notices in it.

## Where to look

App Router docs are in `node_modules/next/dist/docs/01-app/`. Ignore `02-pages/`, which covers the Pages Router this repo does not use.

| Topic | File (under `01-app/`) |
| --- | --- |
| Server vs client components | `01-getting-started/05-server-and-client-components.md`, `02-guides/server-and-client-boundary.md` |
| Fetching data | `01-getting-started/06-fetching-data.md` |
| Server actions / forms | `01-getting-started/07-mutating-data.md`, `02-guides/server-actions.md`, `02-guides/forms.md` |
| Caching (`cacheComponents` is ON) | `01-getting-started/08-caching.md`, `02-guides/migrating-to-cache-components.md`, `03-api-reference/01-directives/use-cache*.md` |
| Revalidation | `01-getting-started/09-revalidating.md`, `02-guides/how-revalidation-works.md` |
| Auth with cache components | `02-guides/authentication-with-cache-components.md`, `02-guides/authentication.md`, `02-guides/data-security.md` |
| Proxy (replaces middleware) | `01-getting-started/16-proxy.md`, `03-api-reference/03-file-conventions/proxy.md` |
| Route handlers | `01-getting-started/15-route-handlers.md`, `03-api-reference/03-file-conventions/route.md` |
| Errors / not-found / unauthorized | `01-getting-started/10-error-handling.md`, `03-api-reference/03-file-conventions/{error,not-found,forbidden,unauthorized}.md` |
| Streaming / Suspense | `02-guides/streaming.md` |
| Prefetching (`partialPrefetching` is ON) | `02-guides/adopting-partial-prefetching.md`, `02-guides/prefetching.md` |
| Functions (`cookies`, `headers`, `redirect`, `connection`, …) | `03-api-reference/04-functions/` |
| next.config options | `03-api-reference/05-config/` |
| Upgrading / breaking changes | `01-getting-started/18-upgrading.md`, `02-guides/upgrading/` |

To find a topic not listed here, search the docs:

```bash
grep -ril "<term>" node_modules/next/dist/docs/01-app | head
```

## Settings in this repo that change behavior

From `next.config.ts`:
- `cacheComponents: true`. Reading dynamic data (`headers()`, `cookies()`, `auth()`, the JSON db) must happen inside a `<Suspense>` boundary or in uncached code. `src/app/(app)/layout.tsx` wraps the shell in Suspense for this reason. Read the cache-components docs before adding `"use cache"`, and never cache anything that is per-user.
- `partialPrefetching: true`.
- `experimental.serverActions.bodySizeLimit: "6mb"`, sized for the 5 MB attachment upload.
- Tailwind 4 runs through a Turbopack loader rule for `*.css`.

## Conventions in this repo

- Route protection is `src/proxy.ts` exporting `proxy` (there is no `middleware.ts`). It is an optimistic redirect only; every page and action still calls `requireUser()`/`requireRole()` from `src/lib/auth.ts`.
- Mutations are server actions in `src/modules/<feature>/actions.ts`. They call the service, map `ValidationError`/`DomainError` to form state, then `revalidatePath(...)` and `redirect(...)`. Call `redirect` outside the `try`, because it works by throwing.
- `params` and `searchParams` are Promises: `await` them.
- While `npm run dev` is running, the `next-devtools` MCP server (`.mcp.json`) reaches the dev server's `/_next/mcp` endpoint. Run `nextjs_index` first, then call `get_errors`, `get_routes`, `get_compilation_issues` or `compile_route` through `nextjs_call` to check work without a full build (see `02-guides/mcp.md`). Use Claude in Chrome to check pages in a real browser.
- After changes, run `npm run build`. It type-checks and catches errors about cache components and dynamic data that `next dev` may only warn about.
