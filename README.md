# Leave Register

A small Leave Management System used as the reference example on day 1 of the workshop. Each module mirrors a pattern from iDCMS.

## Run it

```bash
npm install
cp .env.example .env.local   # then set AUTH_SECRET with `npx auth secret`
npm run dev
```

Open http://localhost:3000 and sign in with a Keycloak account from the `Leave-MGMT-Test` realm. Realm roles named `SUPERVISOR` or `HR_ADMIN` set your role in the register; anyone else signs in as an employee. Data is kept in `data/db.json`, and `npm run db:reset` restores the sample data. Run the reset when switching between branches.

## Branches

Each branch builds on the one before it, so they can be walked through in order.

| Branch | Adds |
| --- | --- |
| `01-setup` | Design tokens, JSON repository, role sign-in, app shell |
| `02-leave-request` | Application form, upload, validation, draft and submit |
| `03-leave-review` | Review queue, decisions, return-and-resubmit loop |
| `04-leave-tracking` | HR dashboard, escalation, balances, archive, notifications, audit log |
| `05-keycloak-auth` | Auth.js sign-in with Keycloak, protected routes via `proxy.ts` |

## Workshop stand-ins

| Here | In the Spring Boot stack |
| --- | --- |
| Auth.js session and `requireRole` | Spring Security + Keycloak |
| `src/lib/workflow.ts` | Flowable |
| Zod schemas | DTO + Bean Validation |
| Server action, service, `src/lib/db.ts` | Controller, Service, Repository |

