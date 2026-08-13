# CandorLens Web

The CandorLens web application is a consent-first interview workspace built with Next.js 16, Neon Auth, and Neon Postgres.

## Local development

1. Copy `.env.example` to `.env.local` and supply the linked Neon values.
2. Install workspace dependencies from the repository root with `corepack pnpm install`.
3. Start the web application with `corepack pnpm --filter @candorlens/web dev`.

The live session always requires visible source selection and explicit consent before browser permissions are requested. Provider credentials are managed from Account settings and remain server-side.

## Verification

Run these commands from `apps/web` before publishing:

```powershell
corepack pnpm test
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
```
