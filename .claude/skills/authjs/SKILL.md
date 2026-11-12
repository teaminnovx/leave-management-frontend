---
name: authjs
description: Auth.js v5 beta (next-auth@5.0.0-beta.32, @auth/core 0.41) with Keycloak, as used in this repo. Use before touching src/auth.ts, src/proxy.ts, src/lib/auth.ts, src/lib/session-actions.ts, src/lib/backend.ts, sign-in/sign-out, sessions, JWT/token refresh, role mapping, or anything importing next-auth.
---

# Auth.js v5 (next-auth beta) in this repo

The installed versions are `next-auth@5.0.0-beta.32` on `@auth/core@0.41.3`. v5 is a different API from v4: there is no `getServerSession`, no `authOptions`, no `[...nextauth]` options object, and env vars use the `AUTH_*` prefix. Most examples online are v4. Check every API against the installed type definitions before using it.

## Sources of truth (installed, version-matched)

- `node_modules/next-auth/index.d.ts`: `NextAuth()` and what it returns (`handlers`, `auth`, `signIn`, `signOut`, `unstable_update`), plus `auth()` used as a wrapper for proxy/route handlers.
- `node_modules/next-auth/lib/types.d.ts`, `lib/index.d.ts`, `lib/actions.d.ts`: config types and the server-side `signIn`/`signOut` options.
- `node_modules/next-auth/jwt.d.ts`: `getToken`, `encode`/`decode`.
- `node_modules/@auth/core/src/types.ts`: callback signatures (`jwt`, `session`, `authorized`, `signIn`, `redirect`), `Account`, `Profile`, `Session`.
- `node_modules/@auth/core/src/providers/keycloak.ts` and `providers/oauth.ts`: Keycloak provider options and OAuth/OIDC config (`checks`, `client`, `issuer`).
- `node_modules/@auth/core/src/lib/`: internals, for when behavior is surprising (cookies, PKCE, callbacks).

```bash
grep -rn "<symbol>" node_modules/next-auth/*.d.ts node_modules/next-auth/lib/*.d.ts node_modules/@auth/core/src | head
```

Context7 also has up-to-date Auth.js docs (library `nextauthjs/next-auth`). Prefer v5 / "authjs.dev" results.

## How this repo wires it

- **`src/auth.ts`**: a single `NextAuth({...})` call.
  - Keycloak runs as a **public client**: `clientSecret: undefined`, `client.token_endpoint_auth_method: "none"`, `checks: ["pkce", "state"]`.
  - The issuer is `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}` (`keycloakIssuer()`).
  - Session strategy is `jwt`, so there is no adapter.
  - In the `jwt` callback on first sign-in:
    - Realm roles are decoded from the **access token**, because the ID token has no roles unless a mapper adds them.
    - Roles map to `EMPLOYEE | SUPERVISOR | HR_ADMIN`, and the strongest role wins.
    - The user is upserted into the JSON db as `kc-<sub>`.
    - The id, access and refresh tokens and `expiresAt` are stored on the JWT.
  - On later calls, the `jwt` callback refreshes the access token 30s before it expires through Keycloak's token endpoint, and sets `error: "RefreshFailed"` if that fails.
  - The `session` callback exposes only `user.id` and `idToken`. **Access and refresh tokens never go to the browser.**
  - Module augmentation for `Session` and `@auth/core/jwt`'s `JWT` lives at the top of the file. Extend it there when adding fields.
- **`getAccessToken()`** (`src/auth.ts`, server only): reads the JWT cookie with `getToken`, detects the `__Secure-` cookie prefix on https, and refreshes if needed. `src/lib/backend.ts` (axios) uses it to send `Authorization: Bearer` to the Spring Boot API.
- **`src/app/api/auth/[...nextauth]/route.ts`**: re-exports `handlers`.
- **`src/proxy.ts`**: `export const proxy = auth((req) => ...)` redirects signed-out users to `/login?callbackUrl=...`. This is optimistic only.
- **`src/lib/auth.ts`**: `currentUser` / `requireUser` / `requireRole` call `auth()` and look the user up in the db. This is the real authorization, and every page and server action must call it.
- **`src/lib/session-actions.ts`**:
  - `signIn("keycloak", { redirectTo })` sanitizes the callback URL with `safePath` to prevent open redirects.
  - Sign-out runs `signOut({ redirect: false })` and then redirects to Keycloak's end-session endpoint with `id_token_hint`.

## Env

`AUTH_SECRET` (`npx auth secret`), `AUTH_KEYCLOAK_ID`, `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `BACKEND_API_URL`, and optionally `AUTH_TRUST_HOST=true` behind a trusted proxy. See `.env.example`.

## Pitfalls

- With `cacheComponents` on, `auth()` reads request headers, so it is dynamic. Call it inside Suspense or in uncached code, and never inside `"use cache"`.
- `account` and `profile` are only present in the `jwt` callback on the sign-in request.
- Changing the JWT shape invalidates nothing on its own. Sign out and back in to test new fields.
- Keycloak role changes take effect only at the next sign-in, because roles are computed once in the `jwt` callback.
