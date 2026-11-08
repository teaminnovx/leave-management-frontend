# Leave Register

A small Leave Management System used as the reference example on day 1 of the workshop. Each module mirrors a pattern from iDCMS.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 and choose a person to sign in as. Data is kept in `data/db.json`, and `npm run db:reset` restores the sample data. Run the reset when switching between branches.

## Branches

Each branch builds on the one before it, so they can be walked through in order.

| Branch | Adds |
| --- | --- |
| `01-setup` | Design tokens, JSON repository, role sign-in, app shell |
| `02-leave-request` | Application form, upload, validation, draft and submit |
| `03-leave-review` | Review queue, decisions, return-and-resubmit loop |
| `04-leave-tracking` | HR dashboard, escalation, balances, archive, notifications, audit log |

## Workshop stand-ins

| Here | In the Spring Boot stack |
| --- | --- |
| Sign-in cookie and `requireRole` | Keycloak |
| `src/lib/workflow.ts` | Flowable |
| Zod schemas | DTO + Bean Validation |
| Server action, service, `src/lib/db.ts` | Controller, Service, Repository |

The sign-in has no password. It exists for the demo and must not be deployed as real authentication.
